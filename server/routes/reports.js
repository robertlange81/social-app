const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
const REASONS = ['spam', 'harassment', 'fake', 'illegal', 'other']

router.post('/', requireAuth, (req, res) => {
  const { userId, reason, details } = req.body || {}
  if (!userId || userId === req.user.id) return res.status(400).json({ error: 'Ungültiger gemeldeter Nutzer.' })
  if (!REASONS.includes(reason)) return res.status(400).json({ error: 'Ungültiger Meldegrund.' })
  if (details && String(details).trim().length > 1000) return res.status(400).json({ error: 'Details dürfen maximal 1000 Zeichen lang sein.' })
  if (!db.prepare('SELECT id FROM users WHERE id = ?').get(userId)) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  const id = uuidv4()
  db.prepare('INSERT INTO reports (id, reporter_id, reported_id, reason, details) VALUES (?, ?, ?, ?, ?)')
    .run(id, req.user.id, userId, reason, details ? String(details).trim() : null)
  res.status(201).json({ report: { id, status: 'open' } })
})

module.exports = router
