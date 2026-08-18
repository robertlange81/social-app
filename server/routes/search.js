const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializePet, computeAge } = require('../lib/pets')
const { attachBookmarked } = require('../lib/bookmarks')
const { isBlocked } = require('../lib/conversations')
const { SPECIES, PURPOSES, GENDERS } = require('../constants/pets')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const { city, species, breed, purpose, gender, minAge, maxAge, q } = req.query
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 12, 1), 50)

  if (species && !SPECIES.includes(species)) return res.status(400).json({ error: 'Ungültige Tierart im Filter.' })
  if (purpose && !PURPOSES.includes(purpose)) return res.status(400).json({ error: 'Ungültiger Zweck im Filter.' })
  if (gender && !GENDERS.includes(gender)) return res.status(400).json({ error: 'Ungültiges Geschlecht im Filter.' })

  let rows = db.prepare('SELECT * FROM pets WHERE owner_id != ?').all(req.user.id)
  rows = rows.filter(p => !isBlocked(req.user.id, p.owner_id))

  if (city) {
    const needle = city.trim().toLowerCase()
    rows = rows.filter(p => (p.city || '').toLowerCase().includes(needle))
  }
  if (species) rows = rows.filter(p => p.species === species)
  if (breed) {
    const needle = breed.trim().toLowerCase()
    rows = rows.filter(p => (p.breed || '').toLowerCase().includes(needle))
  }
  if (purpose) rows = rows.filter(p => p.purpose === purpose || p.purpose === 'both')
  if (gender) rows = rows.filter(p => p.gender === gender)
  if (minAge) rows = rows.filter(p => computeAge(p.birthdate) >= Number(minAge))
  if (maxAge) rows = rows.filter(p => computeAge(p.birthdate) <= Number(maxAge))
  if (q) {
    const needle = q.trim().toLowerCase()
    rows = rows.filter(p => p.name.toLowerCase().includes(needle) || (p.breed || '').toLowerCase().includes(needle) || (p.bio || '').toLowerCase().includes(needle))
  }

  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const total = rows.length
  const start = (page - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const pets = attachBookmarked(pageRows.map(p => serializePet(p)), req.user.id)
  res.json({ pets, total, page, pageSize })
})

module.exports = router
