const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.*, b.created_at AS bookmarked_at FROM bookmarks b
    JOIN users u ON u.id = b.to_user_id
    WHERE b.from_user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id)

  const bookmarks = rows.map(u => Object.assign({}, serializeUser(u), { bookmarkedAt: u.bookmarked_at, isBookmarked: true }))
  res.json({ bookmarks })
})

router.post('/', requireAuth, (req, res) => {
  const { toUserId } = req.body || {}
  if (!toUserId) return res.status(400).json({ error: 'toUserId ist erforderlich.' })
  if (toUserId === req.user.id) return res.status(400).json({ error: 'Du kannst dich nicht selbst merken.' })

  const target = db.prepare('SELECT id FROM users WHERE id = ?').get(toUserId)
  if (!target) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })

  db.prepare(`
    INSERT INTO bookmarks (id, from_user_id, to_user_id) VALUES (?, ?, ?)
    ON CONFLICT(from_user_id, to_user_id) DO NOTHING
  `).run(uuidv4(), req.user.id, toUserId)

  res.status(201).json({ bookmarked: true })
})

router.delete('/:userId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE from_user_id = ? AND to_user_id = ?').run(req.user.id, req.params.userId)
  res.json({ bookmarked: false })
})

module.exports = router
