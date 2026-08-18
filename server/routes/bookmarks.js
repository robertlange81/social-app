const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet } = require('../lib/pets')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, b.created_at AS bookmarked_at FROM bookmarks b
    JOIN pets p ON p.id = b.to_pet_id
    WHERE b.from_user_id = ?
    ORDER BY b.created_at DESC
  `).all(req.user.id)

  const bookmarks = rows.map(p => Object.assign({}, serializePet(p), { bookmarkedAt: p.bookmarked_at, isBookmarked: true }))
  res.json({ bookmarks })
})

router.post('/', requireAuth, (req, res) => {
  const { toPetId } = req.body || {}
  if (!toPetId) return res.status(400).json({ error: 'toPetId ist erforderlich.' })

  const target = db.prepare('SELECT id, owner_id FROM pets WHERE id = ?').get(toPetId)
  if (!target) return res.status(404).json({ error: 'Tier nicht gefunden.' })
  if (target.owner_id === req.user.id) return res.status(400).json({ error: 'Du kannst dein eigenes Tier nicht merken.' })

  db.prepare(`
    INSERT INTO bookmarks (id, from_user_id, to_pet_id) VALUES (?, ?, ?)
    ON CONFLICT(from_user_id, to_pet_id) DO NOTHING
  `).run(uuidv4(), req.user.id, toPetId)

  res.status(201).json({ bookmarked: true })
})

router.delete('/:petId', requireAuth, (req, res) => {
  db.prepare('DELETE FROM bookmarks WHERE from_user_id = ? AND to_pet_id = ?').run(req.user.id, req.params.petId)
  res.json({ bookmarked: false })
})

module.exports = router
