const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const PARTIES = require('../constants/parties')

const GENDERS = ['male', 'female', 'diverse']
const SEEKING_GENDERS = ['male', 'female', 'diverse', 'all']
const MIN_AGE = 18

function computeAge (birthdate) {
  const birth = new Date(birthdate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

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
  if (!data.birthdate || isNaN(new Date(data.birthdate).getTime())) {
    errors.push('Ein gültiges Geburtsdatum ist erforderlich.')
  } else if (computeAge(data.birthdate) < MIN_AGE) {
    errors.push(`Du musst mindestens ${MIN_AGE} Jahre alt sein.`)
  }
  if (!GENDERS.includes(data.gender)) {
    errors.push('Bitte gib dein Geschlecht an.')
  }
  if (!SEEKING_GENDERS.includes(data.seekingGender)) {
    errors.push('Bitte gib an, wen du suchst.')
  }
  if (!PARTIES.includes(data.party)) {
    errors.push('Bitte wähle eine Partei aus - diese Angabe ist Pflicht.')
  }
  if (!data.consentTos) {
    errors.push('Du musst den Nutzungsbedingungen zustimmen.')
  }
  if (!data.consentPolitical) {
    errors.push('Du musst der Verarbeitung deiner Partei-Angabe gesondert zustimmen.')
  }
  return errors
}

function createUser (data) {
  const id = uuidv4()
  const passwordHash = bcrypt.hashSync(data.password, 10)
  const now = new Date().toISOString()
  const stmt = db.prepare(`
    INSERT INTO users (id, handle, email, password_hash, birthdate, gender, seeking_gender, party, city, bio, photo_url, political_consent_at, created_at)
    VALUES (@id, @handle, @email, @passwordHash, @birthdate, @gender, @seekingGender, @party, @city, @bio, @photoUrl, @politicalConsentAt, @createdAt)
  `)
  stmt.run({
    id,
    handle: data.handle.trim(),
    email: data.email.trim().toLowerCase(),
    passwordHash,
    birthdate: data.birthdate,
    gender: data.gender,
    seekingGender: data.seekingGender,
    party: data.party,
    city: data.city ? data.city.trim() : null,
    bio: data.bio ? data.bio.trim() : null,
    photoUrl: data.photoUrl || null,
    politicalConsentAt: now,
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
    birthdate: row.birthdate,
    age: computeAge(row.birthdate),
    gender: row.gender,
    seekingGender: row.seeking_gender,
    party: row.party,
    city: row.city,
    bio: row.bio,
    photoUrl: row.photo_url,
    createdAt: row.created_at
  }
  if (includeEmail) out.email = row.email
  return out
}

module.exports = {
  GENDERS,
  SEEKING_GENDERS,
  MIN_AGE,
  computeAge,
  validateSignupInput,
  createUser,
  verifyPassword,
  serializeUser
}
