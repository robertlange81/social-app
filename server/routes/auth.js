const express = require('express')
const jwt = require('jsonwebtoken')
const db = require('../db')
const { validateSignupInput, createUser, verifyPassword, serializeUser } = require('../lib/users')

const router = express.Router()

function issueToken (user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
}

function setAuthCookie (res, token) {
  res.cookie('authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/'
  })
}

router.post('/signup', (req, res) => {
  const errors = validateSignupInput(req.body || {})
  if (errors.length) return res.status(400).json({ error: errors.join(' ') })

  const existing = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?) OR lower(handle) = lower(?)')
    .get(req.body.email.trim().toLowerCase(), req.body.handle.trim())
  if (existing) return res.status(409).json({ error: 'E-Mail oder Name wird bereits verwendet.' })

  const user = createUser(req.body)
  const token = issueToken(user)
  setAuthCookie(res, token)
  res.status(201).json({ user: serializeUser(user, { includeEmail: true }) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' })
  }

  const token = issueToken(user)
  setAuthCookie(res, token)
  res.json({ user: serializeUser(user, { includeEmail: true }) })
})

router.post('/logout', (req, res) => {
  res.clearCookie('authToken', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ loggedOut: true })
})

module.exports = router
