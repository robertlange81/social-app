const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser, computeAge } = require('../lib/users')
const { attachBookmarked } = require('../lib/bookmarks')
const { isBlocked } = require('../lib/conversations')
const PARTIES = require('../constants/parties')

const router = express.Router()

router.get('/', requireAuth, (req, res) => {
  const me = req.user
  const { minAge, maxAge, party, sort } = req.query
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50)

  if (party && !PARTIES.includes(party)) {
    return res.status(400).json({ error: 'Ungültige Partei im Filter.' })
  }

  const orderClause = sort === 'newest' ? 'u.created_at DESC' : 'RANDOM()'

  const candidates = db.prepare(`
    SELECT u.* FROM users u
    WHERE u.id != @meId
      AND (@meSeeking = 'all' OR u.gender = @meSeeking)
      AND (u.seeking_gender = 'all' OR u.seeking_gender = @meGender)
      AND u.id NOT IN (
        SELECT to_user_id FROM swipes WHERE from_user_id = @meId
      )
    ORDER BY ${orderClause}
    LIMIT 50
  `).all({ meId: me.id, meSeeking: me.seeking_gender, meGender: me.gender })

  let filtered = candidates.filter(u => !isBlocked(me.id, u.id))
  if (party) filtered = filtered.filter(u => u.party === party)
  if (minAge) filtered = filtered.filter(u => computeAge(u.birthdate) >= Number(minAge))
  if (maxAge) filtered = filtered.filter(u => computeAge(u.birthdate) <= Number(maxAge))

  const profiles = attachBookmarked(filtered.slice(0, limit).map(u => serializeUser(u)), me.id)
  res.json({ profiles })
})

module.exports = router
