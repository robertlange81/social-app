const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { getBookmarkedIdSet } = require('../lib/bookmarks')

const router = express.Router()

router.get('/:handle', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE handle = ?').get(req.params.handle)
  if (!user) return res.status(404).json({ error: 'Profil nicht gefunden.' })

  const isSelf = user.id === req.user.id
  if (!isSelf) {
    db.prepare('INSERT INTO profile_views (id, viewer_id, viewed_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.user.id, user.id)
  }

  const isBookmarked = !isSelf && getBookmarkedIdSet(req.user.id).has(user.id)
  res.json({ user: Object.assign({}, serializeUser(user, { includeEmail: isSelf }), { isBookmarked }) })
})

module.exports = router
