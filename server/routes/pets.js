const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { validatePetInput, createPet, serializePet } = require('../lib/pets')
const { getBookmarkedIdSet } = require('../lib/bookmarks')
const { cartoonify } = require('../lib/cartoonify')
const { SPECIES, PURPOSES, GENDERS } = require('../constants/pets')

const router = express.Router()

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).slice(0, 10) || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|webp|gif|heic|heif)$/.test(file.mimetype)) {
      return cb(new Error('Nur Bilddateien (JPG, PNG, WEBP, GIF) sind erlaubt.'))
    }
    cb(null, true)
  }
})

function handleUpload (req, res, next) {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Das Bild ist zu groß (maximal 20 MB).' })
      return res.status(400).json({ error: err.message || 'Bild-Upload fehlgeschlagen.' })
    }
    next()
  })
}

function getOwnPetOr404 (petId, ownerId, res) {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(petId)
  if (!pet) {
    res.status(404).json({ error: 'Tier nicht gefunden.' })
    return null
  }
  if (pet.owner_id !== ownerId) {
    res.status(403).json({ error: 'Das ist nicht dein Tier.' })
    return null
  }
  return pet
}

router.get('/mine', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM pets WHERE owner_id = ? ORDER BY created_at ASC').all(req.user.id)
  res.json({ pets: rows.map(r => serializePet(r)) })
})

router.get('/:id', requireAuth, (req, res) => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id)
  if (!pet) return res.status(404).json({ error: 'Tier nicht gefunden.' })

  const isOwn = pet.owner_id === req.user.id
  if (!isOwn) {
    db.prepare('INSERT INTO profile_views (id, viewer_id, viewed_pet_id) VALUES (?, ?, ?)')
      .run(uuidv4(), req.user.id, pet.id)
  }
  const owner = db.prepare('SELECT * FROM users WHERE id = ?').get(pet.owner_id)
  const isBookmarked = !isOwn && getBookmarkedIdSet(req.user.id).has(pet.id)
  res.json({ pet: Object.assign({}, serializePet(pet, { owner }), { isBookmarked, isOwn }) })
})

router.post('/', requireAuth, (req, res) => {
  const errors = validatePetInput(req.body || {})
  if (errors.length) return res.status(400).json({ error: errors.join(' ') })

  const data = Object.assign({}, req.body)
  if (data.city === undefined || data.city === '') data.city = req.user.city
  const pet = createPet(req.user.id, data)
  res.status(201).json({ pet: serializePet(pet) })
})

router.put('/:id', requireAuth, (req, res) => {
  const pet = getOwnPetOr404(req.params.id, req.user.id, res)
  if (!pet) return

  const { name, species, breed, gender, birthdate, purpose, city, bio } = req.body || {}
  const updates = {}
  if (name !== undefined) {
    if (!String(name).trim()) return res.status(400).json({ error: 'Name des Tieres ist erforderlich.' })
    updates.name = String(name).trim()
  }
  if (species !== undefined) {
    if (!SPECIES.includes(species)) return res.status(400).json({ error: 'Ungültige Tierart.' })
    updates.species = species
  }
  if (breed !== undefined) updates.breed = breed ? String(breed).trim() : null
  if (gender !== undefined) {
    if (!GENDERS.includes(gender)) return res.status(400).json({ error: 'Ungültiges Geschlecht.' })
    updates.gender = gender
  }
  if (birthdate !== undefined) {
    if (!birthdate || isNaN(new Date(birthdate).getTime())) return res.status(400).json({ error: 'Ein gültiges Geburtsdatum ist erforderlich.' })
    updates.birthdate = birthdate
  }
  if (purpose !== undefined) {
    if (!PURPOSES.includes(purpose)) return res.status(400).json({ error: 'Ungültiger Zweck.' })
    updates.purpose = purpose
  }
  if (city !== undefined) updates.city = city ? String(city).trim() : null
  if (bio !== undefined) updates.bio = bio ? String(bio).trim() : null

  const fields = Object.keys(updates)
  if (fields.length) {
    const setClause = fields.map(f => `${f} = @${f}`).join(', ')
    db.prepare(`UPDATE pets SET ${setClause} WHERE id = @id`).run(Object.assign({}, updates, { id: pet.id }))
  }

  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(pet.id)
  res.json({ pet: serializePet(updated) })
})

router.delete('/:id', requireAuth, (req, res) => {
  const pet = getOwnPetOr404(req.params.id, req.user.id, res)
  if (!pet) return

  const matchIds = db.prepare('SELECT id FROM matches WHERE pet_a_id = ? OR pet_b_id = ?').all(pet.id, pet.id).map(m => m.id)
  for (const matchId of matchIds) {
    db.prepare('DELETE FROM messages WHERE match_id = ?').run(matchId)
  }
  db.prepare('DELETE FROM matches WHERE pet_a_id = ? OR pet_b_id = ?').run(pet.id, pet.id)
  db.prepare('DELETE FROM swipes WHERE from_pet_id = ? OR to_pet_id = ?').run(pet.id, pet.id)
  db.prepare('DELETE FROM bookmarks WHERE to_pet_id = ?').run(pet.id)
  db.prepare('DELETE FROM profile_views WHERE viewed_pet_id = ?').run(pet.id)
  db.prepare('DELETE FROM pets WHERE id = ?').run(pet.id)

  res.json({ deleted: true })
})

router.post('/:id/photo', requireAuth, handleUpload, async (req, res) => {
  const pet = getOwnPetOr404(req.params.id, req.user.id, res)
  if (!pet) return
  if (!req.file) return res.status(400).json({ error: 'Kein Bild hochgeladen.' })

  try {
    const cartoonBuffer = await cartoonify(req.file.path)
    const cartoonFilename = `${path.parse(req.file.filename).name}.jpg`
    fs.writeFileSync(path.join(uploadsDir, cartoonFilename), cartoonBuffer)
    if (cartoonFilename !== req.file.filename) fs.unlinkSync(req.file.path)

    const photoUrl = `/uploads/${cartoonFilename}`
    db.prepare('UPDATE pets SET photo_url = ? WHERE id = ?').run(photoUrl, pet.id)
    const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(pet.id)
    res.json({ pet: serializePet(updated) })
  } catch (err) {
    fs.unlink(req.file.path, () => {})
    res.status(500).json({ error: 'Bild konnte nicht verarbeitet werden. Bitte ein anderes Bild versuchen.' })
  }
})

module.exports = router
