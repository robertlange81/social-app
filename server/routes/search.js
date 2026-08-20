const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser, computeAge, GENDERS } = require('../lib/users')
const { attachBookmarked } = require('../lib/bookmarks')
const { isBlocked } = require('../lib/conversations')
const PARTIES = require('../constants/parties')

const router = express.Router()

function distanceKm (a, b) {
  const toRad = degrees => degrees * Math.PI / 180
  const dLat = toRad(b.latitude - a.latitude); const dLon = toRad(b.longitude - a.longitude)
  const lat1 = toRad(a.latitude); const lat2 = toRad(b.latitude)
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

router.get('/map', requireAuth, (req, res) => {
  const mine = db.prepare('SELECT latitude,longitude FROM user_locations WHERE user_id=?').get(req.user.id)
  const rows = db.prepare(`SELECT u.*, l.latitude, l.longitude FROM users u JOIN user_locations l ON l.user_id=u.id
    WHERE u.id != ? AND l.share_on_map=1 LIMIT 500`).all(req.user.id)
    .filter(user => !isBlocked(req.user.id, user.id))
  const profiles = rows.map(user => ({ ...serializeUser(user), location: { latitude: user.latitude, longitude: user.longitude }, distanceKm: mine ? Math.round(distanceKm(mine, user) * 10) / 10 : null }))
  res.json({ profiles, myLocation: mine || null, precisionKm: 1 })
})

router.get('/', requireAuth, (req, res) => {
  const { city, party, gender, minAge, maxAge, q, radiusKm } = req.query
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
  const mine = db.prepare('SELECT latitude,longitude FROM user_locations WHERE user_id=?').get(req.user.id)
  if (radiusKm) {
    const radius = Number(radiusKm)
    if (!mine) return res.status(400).json({ error: 'Aktiviere zuerst deinen ungefähren Standort.' })
    if (!Number.isFinite(radius) || radius < 1 || radius > 500) return res.status(400).json({ error: 'Umkreis muss zwischen 1 und 500 km liegen.' })
    rows = rows.filter(user => {
      const location = db.prepare('SELECT latitude,longitude FROM user_locations WHERE user_id=? AND share_on_map=1').get(user.id)
      if (!location) return false
      user.distanceKm = Math.round(distanceKm(mine, location) * 10) / 10
      user.location = location
      return user.distanceKm <= radius
    })
  }

  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  const total = rows.length
  const start = (page - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const profiles = attachBookmarked(pageRows.map(user => ({ ...serializeUser(user), ...(user.distanceKm !== undefined ? { distanceKm: user.distanceKm, location: user.location } : {}) })), req.user.id)

  res.json({ profiles, total, page, pageSize })
})

module.exports = router
