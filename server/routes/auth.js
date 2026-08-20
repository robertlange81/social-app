const express = require('express')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const { validateSignupInput, createUser, verifyPassword, serializeUser } = require('../lib/users')

const router = express.Router()
const TOKEN_TTL_MS = 60 * 60 * 1000

function createActionToken (userId, type) {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  db.prepare('INSERT INTO auth_action_tokens (id, user_id, type, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)')
    .run(uuidv4(), userId, type, hash, new Date(Date.now() + TOKEN_TTL_MS).toISOString())
  return token
}

function publicActionResult (message, token) {
  return process.env.NODE_ENV === 'production' ? { message } : { message, devToken: token }
}

function deliverActionLink (email, type, token) {
  const baseUrl = process.env.APP_BASE_URL || 'http://localhost:8080'
  const path = type === 'verify_email' ? '/verify-email' : '/password-reset'
  const link = `${baseUrl}${path}?token=${encodeURIComponent(token)}`
  if (!process.env.EMAIL_WEBHOOK_URL) {
    if (!['production', 'test'].includes(process.env.NODE_ENV)) console.log(`[DEV-MAIL] ${email}: ${link}`)
    return
  }
  fetch(process.env.EMAIL_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: email, template: type, link }) })
    .catch(error => console.error('E-Mail-Webhook fehlgeschlagen:', error.message))
}

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
  db.prepare('INSERT OR IGNORE INTO user_security (user_id) VALUES (?)').run(user.id)
  const verificationToken = createActionToken(user.id, 'verify_email')
  deliverActionLink(user.email, 'verify_email', verificationToken)
  const token = issueToken(user)
  setAuthCookie(res, token)
  res.status(201).json({ user: serializeUser(user, { includeEmail: true }), ...(process.env.NODE_ENV === 'production' ? {} : { verificationToken }) })
})

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'E-Mail und Passwort sind erforderlich.' })

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase())
  if (!user || !verifyPassword(user, password)) {
    return res.status(401).json({ error: 'E-Mail oder Passwort ist falsch.' })
  }
  const security = db.prepare('SELECT * FROM user_security WHERE user_id = ?').get(user.id)
  if (security && security.suspended_until && new Date(security.suspended_until) > new Date()) return res.status(403).json({ error: 'Dieses Konto ist vorübergehend gesperrt.' })

  const token = issueToken(user)
  setAuthCookie(res, token)
  res.json({ user: serializeUser(user, { includeEmail: true }) })
})

router.post('/request-password-reset', (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase()
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
  const token = user ? createActionToken(user.id, 'reset_password') : null
  if (user) deliverActionLink(email, 'reset_password', token)
  res.json(publicActionResult('Falls das Konto existiert, wurde eine Rücksetz-Anweisung erstellt.', token))
})

router.post('/reset-password', (req, res) => {
  const token = String(req.body.token || ''); const password = String(req.body.password || '')
  if (password.length < 8 || password.length > 128) return res.status(400).json({ error: 'Das Passwort braucht 8 bis 128 Zeichen.' })
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  const action = db.prepare("SELECT * FROM auth_action_tokens WHERE token_hash = ? AND type = 'reset_password' AND used_at IS NULL").get(hash)
  if (!action || new Date(action.expires_at) < new Date()) return res.status(400).json({ error: 'Der Link ist ungültig oder abgelaufen.' })
  db.transaction(() => { db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), action.user_id); db.prepare("UPDATE auth_action_tokens SET used_at = datetime('now') WHERE id = ?").run(action.id) })()
  res.json({ reset: true })
})

router.post('/verify-email', (req, res) => {
  const hash = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex')
  const action = db.prepare("SELECT * FROM auth_action_tokens WHERE token_hash = ? AND type = 'verify_email' AND used_at IS NULL").get(hash)
  if (!action || new Date(action.expires_at) < new Date()) return res.status(400).json({ error: 'Der Link ist ungültig oder abgelaufen.' })
  db.transaction(() => { db.prepare("UPDATE auth_action_tokens SET used_at = datetime('now') WHERE id = ?").run(action.id); db.prepare("INSERT INTO user_security (user_id, email_verified_at) VALUES (?, datetime('now')) ON CONFLICT(user_id) DO UPDATE SET email_verified_at = excluded.email_verified_at").run(action.user_id) })()
  res.json({ verified: true })
})

router.post('/logout', (req, res) => {
  res.clearCookie('authToken', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ loggedOut: true })
})

module.exports = router
