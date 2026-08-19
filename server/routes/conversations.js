const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { isBlocked, findOrCreateConversation, getOtherUserId, hasMatch } = require('../lib/conversations')

const router = express.Router()

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

  const conversations = rows.map(conv => {
    const otherId = getOtherUserId(conv, req.user.id)
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId)
    const lastMessage = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conv.id)
    return {
      id: conv.id,
      createdAt: conv.created_at,
      otherUser: serializeUser(otherUser),
      hasMatch: hasMatch(req.user.id, otherId),
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

  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC').all(conversation.id)
  res.json({ messages: messages.map(m => ({ id: m.id, body: m.body, senderId: m.sender_id, createdAt: m.created_at })) })
})

router.post('/:id/messages', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  const otherId = getOtherUserId(conversation, req.user.id)
  if (isBlocked(req.user.id, otherId)) return res.status(403).json({ error: 'Nachricht kann nicht gesendet werden.' })

  const body = (req.body && req.body.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' })

  const id = uuidv4()
  db.prepare('INSERT INTO messages (id, conversation_id, sender_id, body) VALUES (?, ?, ?, ?)').run(id, conversation.id, req.user.id, body)

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
  res.status(201).json({ message: { id: message.id, body: message.body, senderId: message.sender_id, createdAt: message.created_at } })
})

router.delete('/:id', requireAuth, (req, res) => {
  const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id)
  if (!assertParticipant(conversation, req.user.id, res)) return

  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(conversation.id)
  db.prepare('DELETE FROM conversations WHERE id = ?').run(conversation.id)
  res.json({ deleted: true })
})

module.exports = router
