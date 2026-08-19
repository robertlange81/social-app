const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { isBlocked, findOrCreateConversation, getOtherUserId, hasMatch } = require('../lib/conversations')
const chatEvents = require('../lib/chatEvents')

const router = express.Router()
const MAX_MESSAGE_LENGTH = 4000

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
  res.json({ messages: messages.map(m => ({ id: m.id, body: m.body, senderId: m.sender_id, createdAt: m.created_at })), hasMore })
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
  const send = message => res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000)
  chatEvents.on(eventName, send)
  req.on('close', () => {
    clearInterval(keepAlive)
    chatEvents.off(eventName, send)
  })
})

router.post('/:id/messages', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  const otherId = getOtherUserId(conversation, req.user.id)
  if (isBlocked(req.user.id, otherId)) return res.status(403).json({ error: 'Nachricht kann nicht gesendet werden.' })

  const body = (req.body && req.body.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' })
  if (body.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Nachricht darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.` })
  }

  const id = uuidv4()
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)').run(id, conversation.id, req.user.id, body)

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
  const serialized = { id: message.id, body: message.body, senderId: message.sender_id, createdAt: message.created_at }
  chatEvents.emit(`conversation:${conversation.id}`, serialized)
  res.status(201).json({ message: serialized })
})

router.delete('/:id', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  db.prepare('DELETE FROM conversation_reads WHERE conversation_id = ?').run(conversation.id)
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation.id)
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversation.id)
  res.json({ deleted: true })
})

module.exports = router
