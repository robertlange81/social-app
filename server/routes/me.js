const express = require('express')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { serializePet } = require('../lib/pets')

const router = express.Router()
const uploadsDir = path.join(__dirname, '..', 'uploads')

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
    const existing = db.prepare('SELECT id FROM users WHERE lower(handle) = lower(?) AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Dieser Name wird bereits verwendet.' })
    updates.handle = trimmed
  }
  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' })
    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?').get(trimmed, req.user.id)
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

router.get('/export', requireAuth, (req, res) => {
  const pets = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(req.user.id)
  const conversations = db.prepare('SELECT * FROM conversations WHERE user_a_id = ? OR user_b_id = ?').all(req.user.id, req.user.id)
  const messages = conversations.flatMap(conversation => db.prepare('SELECT id, conversation_id, sender_id, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conversation.id))
  res.setHeader('Content-Disposition', 'attachment; filename="pfotenmatch-export.json"')
  res.json({
    exportedAt: new Date().toISOString(),
    profile: serializeUser(req.user, { includeEmail: true }),
    pets: pets.map(pet => serializePet(pet)),
    conversations,
    messages
  })
})

router.delete('/', requireAuth, (req, res) => {
  const password = req.body && req.body.password
  if (!password || !bcrypt.compareSync(password, req.user.password_hash)) return res.status(403).json({ error: 'Passwort ist falsch.' })
  const pets = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(req.user.id)
  const petIds = pets.map(pet => pet.id)
  const conversationIds = db.prepare('SELECT id FROM conversations WHERE user_a_id = ? OR user_b_id = ?').all(req.user.id, req.user.id).map(row => row.id)
  db.transaction(() => {
    for (const id of conversationIds) {
      db.prepare('DELETE FROM conversation_reads WHERE conversation_id = ?').run(id)
      db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id)
    }
    db.prepare('DELETE FROM conversations WHERE user_a_id = ? OR user_b_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM reports WHERE reporter_id = ? OR reported_id = ?').run(req.user.id, req.user.id)
    for (const petId of petIds) {
      db.prepare('DELETE FROM matches WHERE pet_a_id = ? OR pet_b_id = ?').run(petId, petId)
      db.prepare('DELETE FROM swipes WHERE from_pet_id = ? OR to_pet_id = ?').run(petId, petId)
      db.prepare('DELETE FROM bookmarks WHERE to_pet_id = ?').run(petId)
      db.prepare('DELETE FROM profile_views WHERE viewed_pet_id = ?').run(petId)
    }
    db.prepare('DELETE FROM bookmarks WHERE from_user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM profile_views WHERE viewer_id = ?').run(req.user.id)
    db.prepare('DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM pets WHERE owner_id = ?').run(req.user.id)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id)
  })()
  for (const pet of pets) {
    if (pet.photo_url && pet.photo_url.startsWith('/uploads/')) fs.unlink(path.join(uploadsDir, path.basename(pet.photo_url)), () => {})
  }
  res.clearCookie('authToken', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ deleted: true })
})

module.exports = router
