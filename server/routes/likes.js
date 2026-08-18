const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet } = require('../lib/pets')
const { attachBookmarked } = require('../lib/bookmarks')

const router = express.Router()

const NOT_MATCHED_CLAUSE = `
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE (m.pet_a_id = @petId AND m.pet_b_id = p.id)
       OR (m.pet_a_id = p.id AND m.pet_b_id = @petId)
  )
`

function requireOwnPet (req, res) {
  const petId = req.query.petId
  if (!petId) {
    res.status(400).json({ error: 'petId ist erforderlich.' })
    return null
  }
  const pet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(petId, req.user.id)
  if (!pet) {
    res.status(404).json({ error: 'Eigenes Tier nicht gefunden.' })
    return null
  }
  return pet
}

router.get('/sent', requireAuth, (req, res) => {
  const pet = requireOwnPet(req, res)
  if (!pet) return

  const rows = db.prepare(`
    SELECT p.*, s.created_at AS liked_at FROM swipes s
    JOIN pets p ON p.id = s.to_pet_id
    WHERE s.from_pet_id = @petId AND s.direction = 'like'
    ${NOT_MATCHED_CLAUSE}
    ORDER BY s.created_at DESC
  `).all({ petId: pet.id })

  const likes = attachBookmarked(rows.map(p => Object.assign({}, serializePet(p), { likedAt: p.liked_at })), req.user.id)
  res.json({ likes })
})

router.get('/received', requireAuth, (req, res) => {
  const pet = requireOwnPet(req, res)
  if (!pet) return

  const rows = db.prepare(`
    SELECT p.*, s.created_at AS liked_at FROM swipes s
    JOIN pets p ON p.id = s.from_pet_id
    WHERE s.to_pet_id = @petId AND s.direction = 'like'
    ${NOT_MATCHED_CLAUSE}
    ORDER BY s.created_at DESC
  `).all({ petId: pet.id })

  const likes = attachBookmarked(rows.map(p => Object.assign({}, serializePet(p), { likedAt: p.liked_at })), req.user.id)
  res.json({ likes })
})

module.exports = router
