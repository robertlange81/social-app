const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')

const router = express.Router()

function getOtherUserId (match, meId) {
  return match.user_a_id === meId ? match.user_b_id : match.user_a_id
}

function assertParticipant (match, meId, res) {
  if (!match) {
    res.status(404).json({ error: 'Match nicht gefunden.' })
    return false
  }
  if (match.user_a_id !== meId && match.user_b_id !== meId) {
    res.status(403).json({ error: 'Kein Zugriff auf dieses Match.' })
    return false
  }
  return true
}

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT * FROM matches WHERE user_a_id = ? OR user_b_id = ? ORDER BY created_at DESC
  `).all(req.user.id, req.user.id)

  const matches = rows.map(match => {
    const otherId = getOtherUserId(match, req.user.id)
    const otherUser = db.prepare('SELECT * FROM users WHERE id = ?').get(otherId)
    const lastMessage = db.prepare(`
      SELECT * FROM messages WHERE match_id = ? ORDER BY created_at DESC LIMIT 1
    `).get(match.id)
    return {
      id: match.id,
      createdAt: match.created_at,
      otherUser: serializeUser(otherUser),
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, senderId: lastMessage.sender_id } : null
    }
  })

  res.json({ matches })
})

router.get('/:id/messages', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!assertParticipant(match, req.user.id, res)) return

  const messages = db.prepare(`
    SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC
  `).all(match.id)

  res.json({
    messages: messages.map(m => ({ id: m.id, body: m.body, senderId: m.sender_id, createdAt: m.created_at }))
  })
})

router.post('/:id/messages', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!assertParticipant(match, req.user.id, res)) return

  const body = (req.body && req.body.body || '').trim()
  if (!body) return res.status(400).json({ error: 'Nachricht darf nicht leer sein.' })

  const id = uuidv4()
  db.prepare(`
    INSERT INTO messages (id, match_id, sender_id, body) VALUES (?, ?, ?, ?)
  `).run(id, match.id, req.user.id, body)

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(id)
  res.status(201).json({ message: { id: message.id, body: message.body, senderId: message.sender_id, createdAt: message.created_at } })
})

router.delete('/:id', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!assertParticipant(match, req.user.id, res)) return

  db.prepare('DELETE FROM messages WHERE match_id = ?').run(match.id)
  db.prepare('DELETE FROM matches WHERE id = ?').run(match.id)

  res.json({ deleted: true })
})

module.exports = router
