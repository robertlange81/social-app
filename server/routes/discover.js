const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet, computeAge } = require('../lib/pets')
const { attachBookmarked } = require('../lib/bookmarks')
const { isBlocked } = require('../lib/conversations')

const router = express.Router()

function effectivePurposes (purpose) {
  return purpose === 'both' ? ['breeding', 'playmate'] : [purpose]
}

// Zwei Tiere passen zusammen, wenn sich ihre Zwecke überschneiden. Ist
// "Spielpartner" Teil der Schnittmenge, spielt Geschlecht keine Rolle;
// bleibt nur "Zuchtpartner" übrig, müssen die Geschlechter unterschiedlich sein.
function isCompatible (mine, candidate) {
  const minePurposes = effectivePurposes(mine.purpose)
  const candidatePurposes = effectivePurposes(candidate.purpose)
  const overlap = minePurposes.filter(p => candidatePurposes.includes(p))
  if (!overlap.length) return false
  if (overlap.includes('playmate')) return true
  return mine.gender !== candidate.gender
}

router.get('/', requireAuth, (req, res) => {
  const { petId, minAge, maxAge, breed, sort } = req.query
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50)

  if (!petId) return res.status(400).json({ error: 'petId ist erforderlich.' })
  const myPet = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(petId, req.user.id)
  if (!myPet) return res.status(404).json({ error: 'Eigenes Tier nicht gefunden.' })

  const orderClause = sort === 'newest' ? 'p.created_at DESC' : 'RANDOM()'

  const candidates = db.prepare(`
    SELECT p.* FROM pets p
    WHERE p.species = @species
      AND p.owner_id != @ownerId
      AND p.id NOT IN (
        SELECT to_pet_id FROM swipes WHERE from_pet_id = @petId
      )
    ORDER BY ${orderClause}
    LIMIT 100
  `).all({ species: myPet.species, ownerId: req.user.id, petId: myPet.id })

  let filtered = candidates
    .filter(c => !isBlocked(req.user.id, c.owner_id))
    .filter(c => isCompatible(myPet, c))
  if (breed) filtered = filtered.filter(c => (c.breed || '').toLowerCase() === breed.toLowerCase())
  if (minAge) filtered = filtered.filter(c => computeAge(c.birthdate) >= Number(minAge))
  if (maxAge) filtered = filtered.filter(c => computeAge(c.birthdate) <= Number(maxAge))

  const pets = attachBookmarked(filtered.slice(0, limit).map(p => serializePet(p)), req.user.id)
  res.json({ pets })
})

module.exports = router
