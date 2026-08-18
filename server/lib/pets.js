const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const { SPECIES, PURPOSES, GENDERS } = require('../constants/pets')

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

function validatePetInput (data) {
  const errors = []
  if (!data.name || String(data.name).trim().length < 1) {
    errors.push('Name des Tieres ist erforderlich.')
  }
  if (!SPECIES.includes(data.species)) {
    errors.push('Bitte gib die Tierart an (Hund oder Katze).')
  }
  if (!GENDERS.includes(data.gender)) {
    errors.push('Bitte gib das Geschlecht des Tieres an.')
  }
  if (!data.birthdate || isNaN(new Date(data.birthdate).getTime())) {
    errors.push('Ein gültiges Geburtsdatum ist erforderlich.')
  } else if (new Date(data.birthdate).getTime() > Date.now()) {
    errors.push('Das Geburtsdatum darf nicht in der Zukunft liegen.')
  }
  if (!PURPOSES.includes(data.purpose)) {
    errors.push('Bitte gib an, wonach das Tier sucht (Zuchtpartner, Spielpartner oder beides).')
  }
  return errors
}

function createPet (ownerId, data) {
  const id = uuidv4()
  db.prepare(`
    INSERT INTO pets (id, owner_id, name, species, breed, gender, birthdate, purpose, city, bio, photo_url)
    VALUES (@id, @ownerId, @name, @species, @breed, @gender, @birthdate, @purpose, @city, @bio, @photoUrl)
  `).run({
    id,
    ownerId,
    name: data.name.trim(),
    species: data.species,
    breed: data.breed ? String(data.breed).trim() : null,
    gender: data.gender,
    birthdate: data.birthdate,
    purpose: data.purpose,
    city: data.city ? String(data.city).trim() : null,
    bio: data.bio ? String(data.bio).trim() : null,
    photoUrl: data.photoUrl || null
  })
  return db.prepare('SELECT * FROM pets WHERE id = ?').get(id)
}

function serializePet (row, { owner } = {}) {
  if (!row) return null
  const out = {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    gender: row.gender,
    birthdate: row.birthdate,
    age: computeAge(row.birthdate),
    purpose: row.purpose,
    city: row.city,
    bio: row.bio,
    photoUrl: row.photo_url,
    createdAt: row.created_at
  }
  if (owner) {
    out.owner = { id: owner.id, handle: owner.handle }
  }
  return out
}

module.exports = { computeAge, validatePetInput, createPet, serializePet }
