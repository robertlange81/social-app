const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.* FROM blocks b
    JOIN users u ON u.id = b.blocked_id
    WHERE b.blocker_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id)
  res.json({ blocked: rows.map(u => serializeUser(u)) })
})

router.post('/', requireAuth, (req, res) => {
  const { userId } = req.body || {}
  if (!userId) return res.status(400).json({ error: 'userId ist erforderlich.' })
  if (userId === req.user.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst blockieren.' })

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(userId)
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })

  db.prepare(`
    INSERT INTO blocks (id, blocker_id, blocked_id) VALUES (?, ?, ?)
    ON CONFLICT(blocker_id, blocked_id) DO NOTHING
  `).run(uuidv4(), req.user.id, userId)

  res.status(201).json({ blocked: true })
})

router.delete('/:userId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(req.user.id, req.params.userId)
  res.json({ blocked: false })
})

module.exports = router
