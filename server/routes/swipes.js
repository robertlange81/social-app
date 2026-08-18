const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet } = require('../lib/pets')
const { isBlocked, findOrCreateConversation } = require('../lib/conversations')

const router = express.Router()

router.post('/', requireAuth, (req, res) => {
  const { fromPetId, toPetId, direction } = req.body || {}
  if (!fromPetId || !toPetId || !['like', 'pass'].includes(direction)) {
    return res.status(400).json({ error: 'fromPetId, toPetId und direction (like/pass) sind erforderlich.' })
  }
  if (fromPetId === toPetId) return res.status(400).json({ error: 'Ein Tier kann nicht sich selbst swipen.' })

  const fromPet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(fromPetId, req.user.id)
  if (!fromPet) return res.status(403).json({ error: 'Das ist nicht dein Tier.' })

  const toPet = db.prepare('SELECT * FROM pets WHERE id = ?').get(toPetId)
  if (!toPet) return res.status(404).json({ error: 'Tier nicht gefunden.' })
  if (isBlocked(req.user.id, toPet.owner_id)) return res.status(403).json({ error: 'Dieses Tier ist für dich nicht verfügbar.' })

  db.prepare(`
    INSERT INTO swipes (id, from_pet_id, to_pet_id, direction)
    VALUES (@id, @from, @to, @direction)
    ON CONFLICT(from_pet_id, to_pet_id) DO UPDATE SET direction = excluded.direction, created_at = datetime('now')
  `).run({ id: uuidv4(), from: fromPetId, to: toPetId, direction })

  if (direction !== 'like') return res.json({ matched: false })

  const reciprocal = db.prepare(`
    SELECT * FROM swipes WHERE from_pet_id = ? AND to_pet_id = ? AND direction = 'like'
  `).get(toPetId, fromPetId)

  if (!reciprocal) return res.json({ matched: false })

  const [petA, petB] = [fromPetId, toPetId].sort()
  db.prepare('INSERT OR IGNORE INTO matches (id, pet_a_id, pet_b_id) VALUES (?, ?, ?)').run(uuidv4(), petA, petB)

  const match = db.prepare('SELECT * FROM matches WHERE pet_a_id = ? AND pet_b_id = ?').get(petA, petB)
  const conversation = findOrCreateConversation(fromPet.owner_id, toPet.owner_id)
  res.json({ matched: true, matchId: match.id, conversationId: conversation.id, otherPet: serializePet(toPet) })
})

module.exports = router
