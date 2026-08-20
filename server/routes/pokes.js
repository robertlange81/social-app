const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { isBlocked } = require('../lib/conversations')
const { createNotification } = require('../lib/notifications')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.created_at AS poked_at, u.* FROM pokes p
    JOIN users u ON u.id = p.from_user_id
    WHERE p.to_user_id = ?
    ORDER BY p.created_at DESC LIMIT 20
  `).all(req.user.id)
  res.json({ pokes: rows.map(row => ({ ...serializeUser(row), pokedAt: row.poked_at })) })
})

router.post('/', requireAuth, (req, res) => {
  const toUserId = req.body && req.body.toUserId
  if (!toUserId || toUserId === req.user.id) return res.status(400).json({ error: 'Wähle eine andere Person zum Anstupsen.' })
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(toUserId)) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  if (isBlocked(req.user.id, toUserId)) return res.status(403).json({ error: 'Dieses Profil ist für dich nicht verfügbar.' })
  db.prepare(`
    INSERT INTO pokes (id, from_user_id, to_user_id) VALUES (?, ?, ?)
    ON CONFLICT(from_user_id, to_user_id) DO UPDATE SET created_at = datetime('now')
  `).run(uuidv4(), req.user.id, toUserId)
  createNotification({ userId: toUserId, actorId: req.user.id, type: 'poke', title: `${req.user.handle} hat dich angestupst`, link: `/profile/${req.user.handle}` })
  res.status(201).json({ poked: true })
})

module.exports = router
