const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { findOrCreateConversation } = require('../lib/conversations')

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
    // Chat läuft über die Unterhaltung, nicht mehr über den Match-Datensatz selbst.
    const conversation = findOrCreateConversation(req.user.id, otherId)
    const lastMessage = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conversation.id)
    return {
      id: match.id,
      createdAt: match.created_at,
      conversationId: conversation.id,
      otherUser: serializeUser(otherUser),
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, senderId: lastMessage.sender_id } : null
    }
  })

  res.json({ matches })
})

router.delete('/:id', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!assertParticipant(match, req.user.id, res)) return

  db.prepare('DELETE FROM matches WHERE id = ?').run(match.id)
  res.json({ deleted: true })
})

module.exports = router
