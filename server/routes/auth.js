const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { validateSignupInput, createUser, verifyPassword, serializeUser } = require('../lib/users')

const router = express.Router()

function issueToken (user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

router.post('/signup', (req, res) => {
  const errors = validateSignupInput(req.body || {})
  if (errors.length) return res.status(400).json({ error: errors.join(' ') })

  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR handle = ?')
    .get(req.body.email.trim().toLowerCase(), req.body.handle.trim())
  if (existing) return res.status(409).json({ error: 'E-Mail oder Name wird bereits verwendet.' })

  const user = createUser(req.body)
  const token = issueToken(user)
  res.status(201).json({ token, user: serializeUser(user, { includeEmail: true }) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' })
  }

  const token = issueToken(user)
  res.json({ token, user: serializeUser(user, { includeEmail: true }) })
})

module.exports = router
