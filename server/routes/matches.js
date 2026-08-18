const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet } = require('../lib/pets')
const { findOrCreateConversation } = require('../lib/conversations')

const router = express.Router()

function getPets (match) {
  const petA = db.prepare('SELECT * FROM pets WHERE id = ?').get(match.pet_a_id)
  const petB = db.prepare('SELECT * FROM pets WHERE id = ?').get(match.pet_b_id)
  return { petA, petB }
}

function assertParticipant (match, ownerId, res) {
  if (!match) {
    res.status(404).json({ error: 'Match nicht gefunden.' })
    return null
  }
  const { petA, petB } = getPets(match)
  if (petA.owner_id === ownerId) return { myPet: petA, otherPet: petB }
  if (petB.owner_id === ownerId) return { myPet: petB, otherPet: petA }
  res.status(403).json({ error: 'Kein Zugriff auf dieses Match.' })
  return null
}

router.get('/', requireAuth, (req, res) => {
  const myPetIds = db.prepare('SELECT id FROM pets WHERE owner_id = ?').all(req.user.id).map(p => p.id)
  if (!myPetIds.length) return res.json({ matches: [] })

  const placeholders = myPetIds.map(() => '?').join(',')
  const rows = db.prepare(`
    SELECT * FROM matches WHERE pet_a_id IN (${placeholders}) OR pet_b_id IN (${placeholders})
    ORDER BY created_at DESC
  `).all(...myPetIds, ...myPetIds)

  const matches = rows.map(match => {
    const { petA, petB } = getPets(match)
    const mine = myPetIds.includes(petA.id) ? petA : petB
    const other = myPetIds.includes(petA.id) ? petB : petA
    // Chat läuft über die Halter-Unterhaltung, nicht mehr über den Match-Datensatz selbst.
    const conversation = findOrCreateConversation(mine.owner_id, other.owner_id)
    const lastMessage = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1').get(conversation.id)
    return {
      id: match.id,
      createdAt: match.created_at,
      conversationId: conversation.id,
      myPet: serializePet(mine),
      otherPet: serializePet(other),
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.created_at, senderId: lastMessage.sender_id } : null
    }
  })

  res.json({ matches })
})

router.delete('/:id', requireAuth, (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id)
  if (!assertParticipant(match, req.user.id, res)) return

  db.prepare('DELETE FROM matches WHERE id = ?').run(match.id)
  res.json({ deleted: true })
})

module.exports = router
