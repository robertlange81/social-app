const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { serializePet } = require('../lib/pets')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user, { includeEmail: true }) })
})

router.get('/visitors', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, u.handle AS visitor_handle, MAX(pv.created_at) AS last_viewed_at, COUNT(pv.id) AS view_count
    FROM profile_views pv
    JOIN pets p ON p.id = pv.viewed_pet_id
    JOIN users u ON u.id = pv.viewer_id
    WHERE p.owner_id = ?
    GROUP BY pv.viewer_id, p.id
    ORDER BY last_viewed_at DESC
    LIMIT 50
  `).all(req.user.id)

  const visitors = rows.map(row => Object.assign({}, serializePet(row), {
    visitorHandle: row.visitor_handle,
    lastViewedAt: row.last_viewed_at,
    viewCount: row.view_count
  }))
  res.json({ visitors })
})

router.put('/', requireAuth, (req, res) => {
  const { handle, email, bio, city, password } = req.body || {}
  const updates = {}

  if (handle !== undefined) {
    const trimmed = String(handle).trim()
    if (trimmed.length < 2) return res.status(400).json({ error: 'Name ist erforderlich (mind. 2 Zeichen).' })
    const existing = db.prepare('SELECT id FROM users WHERE handle = ? AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Dieser Name wird bereits verwendet.' })
    updates.handle = trimmed
  }
  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' })
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Diese E-Mail-Adresse wird bereits verwendet.' })
    updates.email = trimmed
  }
  if (bio !== undefined) updates.bio = bio ? String(bio).trim() : null
  if (city !== undefined) updates.city = city ? String(city).trim() : null
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' })
    updates.password_hash = bcrypt.hashSync(password, 10)
  }

  const fields = Object.keys(updates)
  if (fields.length === 0) return res.json({ user: serializeUser(req.user, { includeEmail: true }) })

  const setClause = fields.map(f => `${f} = @${f}`).join(', ')
  db.prepare(`UPDATE users SET ${setClause} WHERE id = @id`).run(Object.assign({}, updates, { id: req.user.id }))

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: serializeUser(updated, { includeEmail: true }) })
})

module.exports = router
