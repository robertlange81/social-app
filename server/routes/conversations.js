const express = require('express')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { isBlocked, findOrCreateConversation, getOtherUserId, hasMatch } = require('../lib/conversations')
const chatEvents = require('../lib/chatEvents')
const { createNotification } = require('../lib/notifications')
const { validateUserContent } = require('../lib/contentSafety')

const router = express.Router()
const MAX_MESSAGE_LENGTH = 4000
const ALLOWED_REACTIONS = ['❤️', '👍', '😂', '😮', '😢']
const chatUploadsDir = path.join(__dirname, '..', 'uploads', 'chat')
if (!fs.existsSync(chatUploadsDir)) fs.mkdirSync(chatUploadsDir, { recursive: true })
const mediaUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024, files: 1 } }).single('media')

function handleMediaUpload (req, res, next) {
  mediaUpload(req, res, error => {
    if (error) return res.status(400).json({ error: error.code === 'LIMIT_FILE_SIZE' ? 'Datei zu groß (maximal 15 MB).' : 'Upload fehlgeschlagen.' })
    next()
  })
}

function validAudioSignature (buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false
  if (mimeType === 'audio/webm') return buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
  if (mimeType === 'audio/ogg') return buffer.subarray(0, 4).toString() === 'OggS'
  if (mimeType === 'audio/wav' || mimeType === 'audio/x-wav') return buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WAVE'
  if (mimeType === 'audio/mp4') return buffer.subarray(4, 8).toString() === 'ftyp'
  if (mimeType === 'audio/mpeg') return buffer.subarray(0, 3).toString() === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)
  return false
}

function serializeMessage (message, myId) {
  const edit = db.prepare('SELECT * FROM message_edits WHERE message_id = ?').get(message.id)
  const reply = db.prepare(`SELECT original.id, original.body, original.sender_id FROM message_replies mr
    JOIN messages original ON original.id = mr.reply_to_message_id WHERE mr.message_id = ?`).get(message.id)
  const reactions = db.prepare(`SELECT emoji, COUNT(*) AS count,
    EXISTS(SELECT 1 FROM message_reactions mine WHERE mine.message_id = ? AND mine.emoji = r.emoji AND mine.user_id = ?) AS reacted_by_me
    FROM message_reactions r WHERE r.message_id = ? GROUP BY emoji ORDER BY emoji`).all(message.id, myId, message.id)
  const attachmentRow = db.prepare('SELECT * FROM message_attachments WHERE message_id = ?').get(message.id)
  let attachment = null
  if (attachmentRow && !(edit && edit.deleted_at)) {
    const approved = message.sender_id === myId || !attachmentRow.requires_consent || !!db.prepare('SELECT 1 FROM attachment_consents WHERE attachment_id=? AND user_id=?').get(attachmentRow.id, myId)
    attachment = { id: attachmentRow.id, type: attachmentRow.type, mimeType: attachmentRow.mime_type, sizeBytes: attachmentRow.size_bytes, requiresConsent: !!attachmentRow.requires_consent, approved, url: approved ? attachmentRow.url : null }
  }
  return {
    id: message.id, body: edit && edit.deleted_at ? 'Nachricht gelöscht' : (edit && edit.edited_body) || message.body, senderId: message.sender_id, createdAt: message.created_at,
    edited: !!(edit && edit.edited_body), deleted: !!(edit && edit.deleted_at),
    replyTo: reply ? { id: reply.id, body: reply.body, senderId: reply.sender_id } : null,
    reactions: reactions.map(item => ({ emoji: item.emoji, count: item.count, reactedByMe: !!item.reacted_by_me })),
    attachment
  }
}

function assertParticipant (conversation, myId, res) {
  if (!conversation) {
    res.status(404).json({ error: 'Unterhaltung nicht gefunden.' })
    return false
  }
  if (conversation.user_a_id !== myId && conversation.user_b_id !== myId) {
    res.status(403).json({ error: 'Kein Zugriff auf diese Unterhaltung.' })
    return false
  }
  return true
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM conversations WHERE user_a_id = ? OR user_b_id = ? ORDER BY created_at DESC
  `).all(req.user.id, req.user.id)

  const conversations = rows.filter(conv => !isBlocked(req.user.id, getOtherUserId(conv, req.user.id))).map(conv => {
    const otherId = getOtherUserId(conv, req.user.id)
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId)
    const lastMessage = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conv.id)
    const unread = db.prepare(`
      SELECT COUNT(*) AS count FROM messages m
      LEFT JOIN conversation_reads r ON r.conversation_id = m.conversation_id AND r.user_id = ?
      WHERE m.conversation_id = ? AND m.sender_id != ? AND m.created_at > COALESCE(r.read_at, '')
    `).get(req.user.id, conv.id, req.user.id).count
    return {
      id: conv.id,
      createdAt: conv.created_at,
      otherUser: serializeUser(otherUser),
      hasMatch: hasMatch(req.user.id, otherId),
      unreadCount: unread,
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, senderId: lastMessage.sender_id } : null
    }
  })

  res.json({ conversations })
})

router.post('/', requireAuth, (req, res) => {
  const { toUserId } = req.body || {}
  if (!toUserId) return res.status(400).json({ error: 'toUserId ist erforderlich.' })
  if (toUserId === req.user.id) return res.status(400).json({ error: 'Du kannst dir nicht selbst schreiben.' })

  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId)
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  if (isBlocked(req.user.id, toUserId)) return res.status(403).json({ error: 'Mit diesem Nutzer ist kein Chat möglich.' })

  const conversation = findOrCreateConversation(req.user.id, toUserId)
  res.status(201).json({
    conversation: {
      id: conversation.id,
      createdAt: conversation.created_at,
      otherUser: serializeUser(target),
      hasMatch: hasMatch(req.user.id, toUserId)
    }
  })
})

router.get('/:id', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  const otherId = getOtherUserId(conversation, req.user.id)
  if (isBlocked(req.user.id, otherId)) return res.status(403).json({ error: 'Mit diesem Nutzer ist kein Chat möglich.' })
  const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId)
  res.json({
    conversation: {
      id: conversation.id,
      createdAt: conversation.created_at,
      otherUser: serializeUser(otherUser),
      hasMatch: hasMatch(req.user.id, otherId)
    }
  })
})

router.get('/:id/messages', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  if (isBlocked(req.user.id, getOtherUserId(conversation, req.user.id))) return res.status(403).json({ error: 'Mit diesem Nutzer ist kein Chat möglich.' })

  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100)
  const before = req.query.before ? String(req.query.before) : '9999-12-31T23:59:59.999Z'
  const rows = db.prepare(`
    SELECT * FROM messages WHERE conversation_id = ? AND created_at < ?
    ORDER BY created_at DESC LIMIT ?
  `).all(conversation.id, before, limit + 1)
  const hasMore = rows.length > limit
  const messages = rows.slice(0, limit).reverse()
  db.prepare(`
    INSERT INTO conversation_reads (conversation_id, user_id, read_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(conversation_id, user_id) DO UPDATE SET read_at = excluded.read_at
  `).run(conversation.id, req.user.id)
  res.json({ messages: messages.map(message => serializeMessage(message, req.user.id)), hasMore })
})

router.get('/:id/messages/search', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const query = String(req.query.q || '').trim()
  if (query.length < 2 || query.length > 100) return res.status(400).json({ error: 'Die Suche braucht 2 bis 100 Zeichen.' })
  const rows = db.prepare(`SELECT m.* FROM messages m LEFT JOIN message_edits e ON e.message_id=m.id
    WHERE m.conversation_id=? AND e.deleted_at IS NULL AND COALESCE(e.edited_body,m.body) LIKE ? ORDER BY m.created_at DESC LIMIT 50`).all(conversation.id, `%${query}%`)
  res.json({ messages: rows.map(message => serializeMessage(message, req.user.id)) })
})

router.get('/:id/events', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  if (isBlocked(req.user.id, getOtherUserId(conversation, req.user.id))) return res.status(403).json({ error: 'Mit diesem Nutzer ist kein Chat möglich.' })
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const eventName = `conversation:${conversation.id}`
  const send = message => res.write(`event: ${message.type || 'message'}\ndata: ${JSON.stringify(message)}\n\n`)
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000)
  chatEvents.on(eventName, send)
  req.on('close', () => {
    clearInterval(keepAlive)
    chatEvents.off(eventName, send)
  })
})

router.post('/:id/typing', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  chatEvents.emit(`conversation:${conversation.id}`, { type: 'typing', userId: req.user.id, typing: req.body.typing !== false })
  res.json({ sent: true })
})

router.post('/:id/messages', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  const otherId = getOtherUserId(conversation, req.user.id)
  if (isBlocked(req.user.id, otherId)) return res.status(403).json({ error: 'Nachricht kann nicht gesendet werden.' })

  const body = (req.body && req.body.body || '').trim()
  const replyToId = req.body && req.body.replyToId
  if (!body) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' })
  if (body.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Nachricht darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.` })
  }
  const safetyError = validateUserContent(body)
  if (safetyError) return res.status(400).json({ error: safetyError })

  if (replyToId) {
    const original = db.prepare('SELECT 1 FROM messages WHERE id = ? AND conversation_id = ?').get(replyToId, conversation.id)
    if (!original) return res.status(400).json({ error: 'Die beantwortete Nachricht gehört nicht zu diesem Chat.' })
  }
  const id = uuidv4()
  db.transaction(() => {
    db.prepare('INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)').run(id, conversation.id, req.user.id, body)
    if (replyToId) db.prepare('INSERT INTO message_replies (message_id, reply_to_message_id) VALUES (?, ?)').run(id, replyToId)
  })()

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
  const serialized = serializeMessage(message, req.user.id)
  chatEvents.emit(`conversation:${conversation.id}`, serialized)
  createNotification({ userId: otherId, actorId: req.user.id, type: 'message', title: `Neue Nachricht von ${req.user.handle}`, body: body.slice(0, 120), link: `/chat/${conversation.id}` })
  res.status(201).json({ message: serialized })
})

router.post('/:id/media', requireAuth, handleMediaUpload, async (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const otherId = getOtherUserId(conversation, req.user.id)
  if (isBlocked(req.user.id, otherId)) return res.status(403).json({ error: 'Datei kann nicht gesendet werden.' })
  if (!req.file) return res.status(400).json({ error: 'Keine Datei ausgewählt.' })
  const isImage = /^image\/(jpeg|png|webp|gif)$/.test(req.file.mimetype)
  const audioExtensions = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/wav': 'wav', 'audio/x-wav': 'wav' }
  const isAudio = !!audioExtensions[req.file.mimetype]
  if (!isImage && !isAudio) return res.status(400).json({ error: 'Nur Bilder oder Audiodateien sind erlaubt.' })
  if (isAudio && !validAudioSignature(req.file.buffer, req.file.mimetype)) return res.status(400).json({ error: 'Die Audiodatei hat ein ungültiges Format.' })
  if (isImage && req.file.size > 8 * 1024 * 1024) return res.status(400).json({ error: 'Bild zu groß (maximal 8 MB).' })
  const messageId = uuidv4(); const attachmentId = uuidv4(); let filename; let buffer; let mimeType
  try {
    if (isImage) {
      filename = `${attachmentId}.jpg`; mimeType = 'image/jpeg'
      buffer = await sharp(req.file.buffer, { animated: false, limitInputPixels: 40000000 }).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()
    } else {
      filename = `${attachmentId}.${audioExtensions[req.file.mimetype]}`; mimeType = req.file.mimetype; buffer = req.file.buffer
    }
  } catch (_) { return res.status(400).json({ error: 'Die Mediendatei ist beschädigt oder ungültig.' }) }
  fs.writeFileSync(path.join(chatUploadsDir, filename), buffer)
  const body = String(req.body.caption || '').trim().slice(0, 500) || (isImage ? 'Bild' : 'Sprachnachricht')
  db.transaction(() => {
    db.prepare('INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)').run(messageId, conversation.id, req.user.id, body)
    db.prepare('INSERT INTO message_attachments (id,message_id,type,url,mime_type,size_bytes,requires_consent) VALUES (?,?,?,?,?,?,?)')
      .run(attachmentId, messageId, isImage ? 'image' : 'audio', `/uploads/chat/${filename}`, mimeType, buffer.length, isImage && req.body.requireConsent !== 'false' ? 1 : 0)
  })()
  const message = db.prepare('SELECT * FROM messages WHERE id=?').get(messageId)
  const serialized = serializeMessage(message, req.user.id)
  chatEvents.emit(`conversation:${conversation.id}`, serialized)
  createNotification({ userId: otherId, actorId: req.user.id, type: 'message', title: `${req.user.handle} hat ${isImage ? 'ein Bild' : 'eine Sprachnachricht'} gesendet`, link: `/chat/${conversation.id}` })
  res.status(201).json({ message: serialized })
})

router.post('/:id/attachments/:attachmentId/consent', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id=?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const attachment = db.prepare(`SELECT a.*, m.sender_id FROM message_attachments a JOIN messages m ON m.id=a.message_id
    WHERE a.id=? AND m.conversation_id=?`).get(req.params.attachmentId, conversation.id)
  if (!attachment) return res.status(404).json({ error: 'Anhang nicht gefunden.' })
  if (attachment.sender_id === req.user.id) return res.status(400).json({ error: 'Eigene Anhänge sind bereits sichtbar.' })
  db.prepare('INSERT OR IGNORE INTO attachment_consents (attachment_id,user_id) VALUES (?,?)').run(attachment.id, req.user.id)
  res.json({ approved: true, url: attachment.url })
})

router.post('/:id/messages/:messageId/reactions', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  if (isBlocked(req.user.id, getOtherUserId(conversation, req.user.id))) return res.status(403).json({ error: 'Reaktion nicht möglich.' })
  const message = db.prepare('SELECT * FROM messages WHERE id = ? AND conversation_id = ?').get(req.params.messageId, conversation.id)
  if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' })
  const emoji = req.body && req.body.emoji
  if (!ALLOWED_REACTIONS.includes(emoji)) return res.status(400).json({ error: 'Diese Reaktion ist nicht erlaubt.' })
  const existing = db.prepare('SELECT 1 FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').get(message.id, req.user.id, emoji)
  if (existing) db.prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?').run(message.id, req.user.id, emoji)
  else db.prepare('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)').run(message.id, req.user.id, emoji)
  chatEvents.emit(`conversation:${conversation.id}`, { type: 'reaction', messageId: message.id })
  if (message.sender_id !== req.user.id) createNotification({ userId: message.sender_id, actorId: req.user.id, type: 'reaction', title: `${req.user.handle} hat auf deine Nachricht reagiert`, body: emoji, link: `/chat/${conversation.id}` })
  res.json({ reacted: !existing, message: serializeMessage(message, req.user.id) })
})

router.patch('/:id/messages/:messageId', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const message = db.prepare('SELECT * FROM messages WHERE id=? AND conversation_id=?').get(req.params.messageId, conversation.id)
  if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' })
  if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Nur eigene Nachrichten können bearbeitet werden.' })
  const body = String(req.body.body || '').trim()
  if (!body || body.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: 'Nachricht ist leer oder zu lang.' })
  db.prepare(`INSERT INTO message_edits (message_id, edited_body) VALUES (?, ?)
    ON CONFLICT(message_id) DO UPDATE SET edited_body=excluded.edited_body, deleted_at=NULL, edited_at=datetime('now')`).run(message.id, body)
  chatEvents.emit(`conversation:${conversation.id}`, { type: 'message-update', messageId: message.id })
  res.json({ message: serializeMessage(message, req.user.id) })
})

router.delete('/:id/messages/:messageId', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const message = db.prepare('SELECT * FROM messages WHERE id=? AND conversation_id=?').get(req.params.messageId, conversation.id)
  if (!message) return res.status(404).json({ error: 'Nachricht nicht gefunden.' })
  if (message.sender_id !== req.user.id) return res.status(403).json({ error: 'Nur eigene Nachrichten können gelöscht werden.' })
  db.prepare(`INSERT INTO message_edits (message_id, deleted_at) VALUES (?, datetime('now'))
    ON CONFLICT(message_id) DO UPDATE SET deleted_at=datetime('now'), edited_body=NULL, edited_at=datetime('now')`).run(message.id)
  db.prepare('DELETE FROM message_reactions WHERE message_id=?').run(message.id)
  chatEvents.emit(`conversation:${conversation.id}`, { type: 'message-update', messageId: message.id })
  res.json({ deleted: true })
})

router.get('/:id/date-plans', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const plans = db.prepare('SELECT * FROM date_plans WHERE conversation_id = ? ORDER BY created_at DESC').all(conversation.id)
  res.json({ plans: plans.map(plan => ({ id: plan.id, proposedBy: plan.proposed_by, startsAt: plan.starts_at, place: plan.place, activity: plan.activity, note: plan.note, status: plan.status, createdAt: plan.created_at })) })
})

router.get('/:id/date-plans/:planId/calendar.ics', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const plan = db.prepare('SELECT * FROM date_plans WHERE id=? AND conversation_id=?').get(req.params.planId, conversation.id)
  if (!plan) return res.status(404).json({ error: 'Date-Vorschlag nicht gefunden.' })
  const escape = value => String(value || '').replace(/[\\;,\n]/g, char => ({ '\\': '\\\\', ';': '\\;', ',': '\\,', '\n': '\\n' })[char])
  const start = new Date(plan.starts_at).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Herzklang//Date Plan//DE', 'BEGIN:VEVENT', `UID:${plan.id}@herzklang`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART:${start}`, `SUMMARY:${escape(plan.activity)}`, `LOCATION:${escape(plan.place)}`, `DESCRIPTION:${escape(plan.note)}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n')
  res.type('text/calendar').set('Content-Disposition', `attachment; filename="herzklang-date-${plan.id}.ics"`).send(ics)
})

router.post('/:id/date-plans', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  if (isBlocked(req.user.id, getOtherUserId(conversation, req.user.id))) return res.status(403).json({ error: 'Date-Vorschlag nicht möglich.' })
  const startsAt = String(req.body.startsAt || ''); const place = String(req.body.place || '').trim()
  const activity = String(req.body.activity || '').trim(); const note = String(req.body.note || '').trim()
  if (!startsAt || Number.isNaN(Date.parse(startsAt)) || place.length < 2 || place.length > 200 || activity.length < 2 || activity.length > 100 || note.length > 500) {
    return res.status(400).json({ error: 'Termin, Aktivität oder Ort ist ungültig.' })
  }
  if (new Date(startsAt).getTime() <= Date.now()) return res.status(400).json({ error: 'Der Termin muss in der Zukunft liegen.' })
  const id = uuidv4()
  db.prepare('INSERT INTO date_plans (id, conversation_id, proposed_by, starts_at, place, activity, note) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, conversation.id, req.user.id, startsAt, place, activity, note || null)
  createNotification({ userId: getOtherUserId(conversation, req.user.id), actorId: req.user.id, type: 'date_plan', title: `${req.user.handle} schlägt ein Date vor`, body: `${activity} · ${place}`, link: `/chat/${conversation.id}` })
  res.status(201).json({ id })
})

router.patch('/:id/date-plans/:planId', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const plan = db.prepare('SELECT * FROM date_plans WHERE id = ? AND conversation_id = ?').get(req.params.planId, conversation.id)
  if (!plan) return res.status(404).json({ error: 'Date-Vorschlag nicht gefunden.' })
  const status = req.body && req.body.status
  if (!['accepted', 'declined', 'cancelled'].includes(status)) return res.status(400).json({ error: 'Ungültiger Status.' })
  if (status === 'cancelled' && plan.proposed_by !== req.user.id) return res.status(403).json({ error: 'Nur der Absender kann den Vorschlag zurückziehen.' })
  if (status !== 'cancelled' && plan.proposed_by === req.user.id) return res.status(403).json({ error: 'Die andere Person muss antworten.' })
  if (plan.status !== 'proposed') return res.status(409).json({ error: 'Dieser Vorschlag wurde bereits beantwortet.' })
  db.prepare("UPDATE date_plans SET status = ?, responded_at = datetime('now') WHERE id = ?").run(status, plan.id)
  createNotification({ userId: plan.proposed_by, actorId: req.user.id, type: 'date_response', title: `Date-Vorschlag ${status === 'accepted' ? 'angenommen' : 'beantwortet'}`, body: `${plan.activity} · ${plan.place}`, link: `/chat/${conversation.id}` })
  res.json({ status })
})

router.post('/:id/date-plans/:planId/checkin', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return
  const plan = db.prepare('SELECT * FROM date_plans WHERE id=? AND conversation_id=?').get(req.params.planId, conversation.id)
  if (!plan || plan.status !== 'accepted') return res.status(409).json({ error: 'Check-in ist nur für ein bestätigtes Date möglich.' })
  const status = req.body && req.body.status
  if (!['on_my_way', 'arrived', 'safe_home'].includes(status)) return res.status(400).json({ error: 'Ungültiger Sicherheitsstatus.' })
  db.prepare(`INSERT INTO date_safety_checkins (date_plan_id,user_id,status) VALUES (?,?,?)
    ON CONFLICT(date_plan_id,user_id) DO UPDATE SET status=excluded.status, updated_at=datetime('now')`).run(plan.id, req.user.id, status)
  createNotification({ userId: getOtherUserId(conversation, req.user.id), actorId: req.user.id, type: 'date_checkin', title: `${req.user.handle}: ${status === 'safe_home' ? 'sicher angekommen' : status === 'arrived' ? 'am Treffpunkt' : 'auf dem Weg'}`, link: `/chat/${conversation.id}` })
  res.json({ status })
})

router.delete('/:id', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  const attachmentUrls = db.prepare('SELECT url FROM message_attachments WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?)').all(conversation.id).map(row => row.url)
  db.transaction(() => {
    const messageIds = db.prepare('SELECT id FROM messages WHERE conversation_id = ?').all(conversation.id).map(row => row.id)
    for (const messageId of messageIds) {
      db.prepare('DELETE FROM attachment_consents WHERE attachment_id IN (SELECT id FROM message_attachments WHERE message_id=?)').run(messageId)
      db.prepare('DELETE FROM message_attachments WHERE message_id=?').run(messageId)
      db.prepare('DELETE FROM message_edits WHERE message_id = ?').run(messageId)
      db.prepare('DELETE FROM message_reactions WHERE message_id = ?').run(messageId)
      db.prepare('DELETE FROM message_replies WHERE message_id = ? OR reply_to_message_id = ?').run(messageId, messageId)
    }
    db.prepare('DELETE FROM date_safety_checkins WHERE date_plan_id IN (SELECT id FROM date_plans WHERE conversation_id = ?)').run(conversation.id)
    db.prepare('DELETE FROM date_plans WHERE conversation_id = ?').run(conversation.id)
    db.prepare('DELETE FROM conversation_reads WHERE conversation_id = ?').run(conversation.id)
    db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation.id)
    db.prepare('DELETE FROM conversations WHERE id = ?').run(conversation.id)
  })()
  attachmentUrls.forEach(url => fs.unlink(path.join(__dirname, '..', url), () => {}))
  res.json({ deleted: true })
})

module.exports = router
