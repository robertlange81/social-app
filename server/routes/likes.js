const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { attachBookmarked } = require('../lib/bookmarks')

const router = express.Router()

const NOT_MATCHED_CLAUSE = `
  AND NOT EXISTS (
    SELECT 1 FROM matches m
    WHERE (m.user_a_id = @meId AND m.user_b_id = u.id)
       OR (m.user_a_id = u.id AND m.user_b_id = @meId)
  )
`

router.get('/sent', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.*, s.created_at AS liked_at FROM swipes s
    JOIN users u ON u.id = s.to_user_id
    WHERE s.from_user_id = @meId AND s.direction = 'like'
    ${NOT_MATCHED_CLAUSE}
    ORDER BY s.created_at DESC
  `).all({ meId: req.user.id })

  const likes = attachBookmarked(rows.map(u => Object.assign({}, serializeUser(u), { likedAt: u.liked_at })), req.user.id)
  res.json({ likes })
})

router.get('/received', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.*, s.created_at AS liked_at FROM swipes s
    JOIN users u ON u.id = s.from_user_id
    WHERE s.to_user_id = @meId AND s.direction = 'like'
    ${NOT_MATCHED_CLAUSE}
    ORDER BY s.created_at DESC
  `).all({ meId: req.user.id })

  const likes = attachBookmarked(rows.map(u => Object.assign({}, serializeUser(u), { likedAt: u.liked_at })), req.user.id)
  res.json({ likes })
})

module.exports = router
