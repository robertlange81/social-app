const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

function validateSignupInput (data) {
  const errors = []
  if (!data.handle || typeof data.handle !== 'string' || data.handle.trim().length < 2) {
    errors.push('Name ist erforderlich (mind. 2 Zeichen).')
  }
  if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Eine gültige E-Mail-Adresse ist erforderlich.')
  }
  if (!data.password || data.password.length < 6) {
    errors.push('Das Passwort muss mindestens 6 Zeichen lang sein.')
  }
  return errors
}

function createUser (data) {
  const id = uuidv4()
  const passwordHash = bcrypt.hashSync(data.password, 10)
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO users (id, handle, email, password_hash, city, bio, photo_url, created_at)
    VALUES (@id, @handle, @email, @passwordHash, @city, @bio, @photoUrl, @createdAt)
  `).run({
    id,
    handle: data.handle.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash,
    city: data.city ? data.city.trim() : null,
    bio: data.bio ? data.bio.trim() : null,
    photoUrl: data.photoUrl || null,
    createdAt: now
  })
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id)
}

function verifyPassword (user, password) {
  return bcrypt.compareSync(password, user.password_hash)
}

function serializeUser (row, { includeEmail = false } = {}) {
  if (!row) return null
  const out = {
    id: row.id,
    handle: row.handle,
    city: row.city,
    bio: row.bio,
    photoUrl: row.photo_url,
    createdAt: row.created_at
  }
  if (includeEmail) out.email = row.email
  return out
}

module.exports = {
  validateSignupInput,
  createUser,
  verifyPassword,
  serializeUser
}
