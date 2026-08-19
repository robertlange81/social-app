const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { isBlocked, findOrCreateConversation } = require('../lib/conversations')

const router = express.Router()

router.post('/', requireAuth, (req, res) => {
  const { toUserId, direction } = req.body || {}
  if (!toUserId || !['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'toUserId und direction (like/pass) sind erforderlich.' })
  }
  if (toUserId === req.user.id) {
    return res.status(400).json({ error: 'Du kannst dich nicht selbst swipen.' })
  }
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(toUserId)
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  if (isBlocked(req.user.id, toUserId)) return res.status(403).json({ error: 'Dieses Profil ist für dich nicht verfügbar.' })

  db.prepare(`
    INSERT INTO swipes (id, from_user_id, to_user_id, direction)
    VALUES (@id, @from, @to, @direction)
    ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET direction = excluded.direction, created_at = datetime('now')
  `).run({ id: uuidv4(), from: req.user.id, to: toUserId, direction })

  if (direction !== 'like') return res.json({ matched: false })

  const reciprocal = db.prepare(`
    SELECT * FROM swipes WHERE from_user_id = ? AND to_user_id = ? AND direction = 'like'
  `).get(toUserId, req.user.id)

  if (!reciprocal) return res.json({ matched: false })

  const [userA, userB] = [req.user.id, toUserId].sort()
  db.prepare(`
    INSERT OR IGNORE INTO matches (id, user_a_id, user_b_id) VALUES (?, ?, ?)
  `).run(uuidv4(), userA, userB)

  const match = db.prepare('SELECT * FROM matches WHERE user_a_id = ? AND user_b_id = ?').get(userA, userB)
  const conversation = findOrCreateConversation(req.user.id, toUserId)
  res.json({ matched: true, matchId: match.id, conversationId: conversation.id, otherUser: serializeUser(target) })
})

module.exports = router
