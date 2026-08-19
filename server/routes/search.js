const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser, computeAge, GENDERS } = require('../lib/users')
const { attachBookmarked } = require('../lib/bookmarks')
const { isBlocked } = require('../lib/conversations')
const PARTIES = require('../constants/parties')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const { city, party, gender, minAge, maxAge, q } = req.query
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 12, 1), 50)

  if (party && !PARTIES.includes(party)) {
    return res.status(400).json({ error: 'Ungültige Partei im Filter.' })
  }
  if (gender && !GENDERS.includes(gender)) {
    return res.status(400).json({ error: 'Ungültiges Geschlecht im Filter.' })
  }

  let rows = db.prepare('SELECT * FROM users WHERE id != ?').all(req.user.id)
  rows = rows.filter(u => !isBlocked(req.user.id, u.id))

  if (city) {
    const needle = city.trim().toLowerCase()
    rows = rows.filter(u => (u.city || '').toLowerCase().includes(needle))
  }
  if (party) rows = rows.filter(u => u.party === party)
  if (gender) rows = rows.filter(u => u.gender === gender)
  if (minAge) rows = rows.filter(u => computeAge(u.birthdate) >= Number(minAge))
  if (maxAge) rows = rows.filter(u => computeAge(u.birthdate) <= Number(maxAge))
  if (q) {
    const needle = q.trim().toLowerCase()
    rows = rows.filter(u => u.handle.toLowerCase().includes(needle) || (u.bio || '').toLowerCase().includes(needle))
  }

  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const total = rows.length
  const start = (page - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const profiles = attachBookmarked(pageRows.map(u => serializeUser(u)), req.user.id)

  res.json({ profiles, total, page, pageSize })
})

module.exports = router
