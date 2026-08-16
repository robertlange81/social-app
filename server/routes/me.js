const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser, GENDERS, SEEKING_GENDERS, MIN_AGE, computeAge } = require('../lib/users')
const PARTIES = require('../constants/parties')
const { cartoonify } = require('../lib/cartoonify')

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
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Das Bild ist zu groß (maximal 20 MB).' })
      }
      return res.status(400).json({ error: err.message || 'Bild-Upload fehlgeschlagen.' })
    }
    next()
  })
}

router.get('/', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user, { includeEmail: true }) })
})

router.get('/visitors', requireAuth, (req, res) => {
  const rows = db.prepare(`
    SELECT u.*, MAX(pv.created_at) AS last_viewed_at, COUNT(pv.id) AS view_count
    FROM profile_views pv
    JOIN users u ON u.id = pv.viewer_id
    WHERE pv.viewed_id = ?
    GROUP BY pv.viewer_id
    ORDER BY last_viewed_at DESC
    LIMIT 50
  `).all(req.user.id)

  const visitors = rows.map(u => Object.assign({}, serializeUser(u), {
    lastViewedAt: u.last_viewed_at,
    viewCount: u.view_count
  }))
  res.json({ visitors })
})

const COLUMN_NAMES = {
  handle: 'handle',
  email: 'email',
  bio: 'bio',
  city: 'city',
  birthdate: 'birthdate',
  gender: 'gender',
  seekingGender: 'seeking_gender',
  party: 'party',
  passwordHash: 'password_hash'
}

router.put('/', requireAuth, (req, res) => {
  const { handle, email, bio, city, birthdate, gender, seekingGender, party, password } = req.body || {}
  const updates = {}

  if (handle !== undefined) {
    const trimmed = String(handle).trim()
    if (trimmed.length < 2) return res.status(400).json({ error: 'Name ist erforderlich (mind. 2 Zeichen).' })
    const existing = db.prepare('SELECT id FROM users WHERE handle = ? AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Dieser Name wird bereits verwendet.' })
    updates.handle = trimmed
  }
  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' })
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Diese E-Mail-Adresse wird bereits verwendet.' })
    updates.email = trimmed
  }
  if (bio !== undefined) updates.bio = bio ? String(bio).trim() : null
  if (city !== undefined) updates.city = city ? String(city).trim() : null
  if (birthdate !== undefined) {
    if (!birthdate || isNaN(new Date(birthdate).getTime())) return res.status(400).json({ error: 'Ein gültiges Geburtsdatum ist erforderlich.' })
    if (computeAge(birthdate) < MIN_AGE) return res.status(400).json({ error: `Du musst mindestens ${MIN_AGE} Jahre alt sein.` })
    updates.birthdate = birthdate
  }
  if (gender !== undefined) {
    if (!GENDERS.includes(gender)) return res.status(400).json({ error: 'Ungültiges Geschlecht.' })
    updates.gender = gender
  }
  if (seekingGender !== undefined) {
    if (!SEEKING_GENDERS.includes(seekingGender)) return res.status(400).json({ error: 'Ungültige Angabe, wen du suchst.' })
    updates.seekingGender = seekingGender
  }
  if (party !== undefined) {
    if (!PARTIES.includes(party)) return res.status(400).json({ error: 'Bitte wähle eine gültige Partei.' })
    updates.party = party
  }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' })
    updates.passwordHash = bcrypt.hashSync(password, 10)
  }

  const fields = Object.keys(updates)
  if (fields.length === 0) return res.json({ user: serializeUser(req.user, { includeEmail: true }) })

  const setClause = fields.map(f => `${COLUMN_NAMES[f]} = @${f}`).join(', ')
  db.prepare(`UPDATE users SET ${setClause} WHERE id = @id`).run({ ...updates, id: req.user.id })

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  res.json({ user: serializeUser(updated, { includeEmail: true }) })
})

router.post('/photo', requireAuth, handleUpload, async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Kein Bild hochgeladen.' })

  try {
    const cartoonBuffer = await cartoonify(req.file.path)
    const cartoonFilename = `${path.parse(req.file.filename).name}.jpg`
    fs.writeFileSync(path.join(uploadsDir, cartoonFilename), cartoonBuffer)
    if (cartoonFilename !== req.file.filename) fs.unlinkSync(req.file.path)

    const photoUrl = `/uploads/${cartoonFilename}`
    db.prepare('UPDATE users SET photo_url = ? WHERE id = ?').run(photoUrl, req.user.id)
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    res.json({ user: serializeUser(updated, { includeEmail: true }) })
  } catch (err) {
    fs.unlink(req.file.path, () => {})
    res.status(500).json({ error: 'Bild konnte nicht verarbeitet werden. Bitte ein anderes Bild versuchen.' })
  }
})

module.exports = router
