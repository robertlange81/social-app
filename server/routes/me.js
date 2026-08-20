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
  limits: { fileSize: 10 * 1024 * 1024 },
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
        return res.status(400).json({ error: 'Das Bild ist zu groß (maximal 10 MB).' })
      }
      return res.status(400).json({ error: err.message || 'Bild-Upload fehlgeschlagen.' })
    }
    next()
  })
}

router.get('/', requireAuth, (req, res) => {
  res.json({ user: serializeUser(req.user, { includeEmail: true }) })
})

const CONSENT_TYPES = ['political_profile', 'map_visibility']

router.get('/privacy-settings', requireAuth, (req, res) => {
  const preferences = db.prepare('SELECT * FROM user_preferences WHERE user_id=?').get(req.user.id)
  const consents = db.prepare('SELECT consent_type,policy_version,granted_at,revoked_at FROM user_consents WHERE user_id=?').all(req.user.id)
  res.json({
    preferences: {
      notifyMatches: preferences ? !!preferences.notify_matches : true,
      notifyMessages: preferences ? !!preferences.notify_messages : true,
      notifySocial: preferences ? !!preferences.notify_social : true,
      darkMode: preferences ? !!preferences.dark_mode : false,
      onboardingCompleted: preferences ? !!preferences.onboarding_completed : false
    },
    consents
  })
})

router.put('/preferences', requireAuth, (req, res) => {
  const current = db.prepare('SELECT * FROM user_preferences WHERE user_id=?').get(req.user.id) || {}
  const value = (name, column, fallback) => req.body[name] === undefined ? (current[column] === undefined ? fallback : current[column]) : (req.body[name] ? 1 : 0)
  const preferences = {
    notifyMatches: value('notifyMatches', 'notify_matches', 1), notifyMessages: value('notifyMessages', 'notify_messages', 1),
    notifySocial: value('notifySocial', 'notify_social', 1), darkMode: value('darkMode', 'dark_mode', 0),
    onboardingCompleted: value('onboardingCompleted', 'onboarding_completed', 0)
  }
  db.prepare(`INSERT INTO user_preferences (user_id,notify_matches,notify_messages,notify_social,dark_mode,onboarding_completed)
    VALUES (@userId,@notifyMatches,@notifyMessages,@notifySocial,@darkMode,@onboardingCompleted)
    ON CONFLICT(user_id) DO UPDATE SET notify_matches=excluded.notify_matches,notify_messages=excluded.notify_messages,notify_social=excluded.notify_social,dark_mode=excluded.dark_mode,onboarding_completed=excluded.onboarding_completed,updated_at=datetime('now')`)
    .run({ userId: req.user.id, ...preferences })
  res.json({ preferences: Object.fromEntries(Object.entries(preferences).map(([key, value]) => [key, !!value])) })
})

router.put('/consents/:type', requireAuth, (req, res) => {
  const type = req.params.type
  if (!CONSENT_TYPES.includes(type)) return res.status(400).json({ error: 'Unbekannte Einwilligung.' })
  const granted = req.body.granted === true
  const version = String(req.body.policyVersion || '2026-08-20').slice(0, 30)
  db.prepare(`INSERT INTO user_consents (user_id,consent_type,policy_version,granted_at,revoked_at) VALUES (?,?,?,?,?)
    ON CONFLICT(user_id,consent_type) DO UPDATE SET policy_version=excluded.policy_version,granted_at=excluded.granted_at,revoked_at=excluded.revoked_at`)
    .run(req.user.id, type, version, granted ? new Date().toISOString() : null, granted ? null : new Date().toISOString())
  if (type === 'map_visibility' && !granted) db.prepare('UPDATE user_locations SET share_on_map=0 WHERE user_id=?').run(req.user.id)
  if (type === 'political_profile' && !granted) {
    db.prepare("UPDATE users SET party='Keine Angabe' WHERE id=?").run(req.user.id)
    db.prepare('DELETE FROM resonance_answers WHERE user_id=?').run(req.user.id)
    db.prepare('DELETE FROM resonance_preferences WHERE user_id=?').run(req.user.id)
  }
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id)
  res.json({ granted, user: serializeUser(user, { includeEmail: true }) })
})

router.get('/location', requireAuth, (req, res) => {
  const location = db.prepare('SELECT latitude,longitude,share_on_map,updated_at FROM user_locations WHERE user_id=?').get(req.user.id)
  res.json({ location: location ? { latitude: location.latitude, longitude: location.longitude, shareOnMap: !!location.share_on_map, updatedAt: location.updated_at } : null })
})

router.put('/location', requireAuth, (req, res) => {
  const latitude = Number(req.body.latitude); const longitude = Number(req.body.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return res.status(400).json({ error: 'Ungültige Koordinaten.' })
  const coarseLatitude = Math.round(latitude * 100) / 100
  const coarseLongitude = Math.round(longitude * 100) / 100
  const shareOnMap = req.body.shareOnMap !== false ? 1 : 0
  db.prepare(`INSERT INTO user_locations (user_id,latitude,longitude,share_on_map) VALUES (?,?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET latitude=excluded.latitude,longitude=excluded.longitude,share_on_map=excluded.share_on_map,updated_at=datetime('now')`)
    .run(req.user.id, coarseLatitude, coarseLongitude, shareOnMap)
  res.json({ location: { latitude: coarseLatitude, longitude: coarseLongitude, shareOnMap: !!shareOnMap }, precisionKm: 1 })
})

router.delete('/location', requireAuth, (req, res) => {
  db.prepare('DELETE FROM user_locations WHERE user_id=?').run(req.user.id)
  res.json({ deleted: true })
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
    const existing = db.prepare('SELECT id FROM users WHERE lower(handle) = lower(?) AND id != ?').get(trimmed, req.user.id)
    if (existing) return res.status(409).json({ error: 'Dieser Name wird bereits verwendet.' })
    updates.handle = trimmed
  }
  if (email !== undefined) {
    const trimmed = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return res.status(400).json({ error: 'Eine gültige E-Mail-Adresse ist erforderlich.' })
    const existing = db.prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?').get(trimmed, req.user.id)
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
    if (req.user.photo_url && req.user.photo_url.startsWith('/uploads/') && req.user.photo_url !== photoUrl) {
      fs.unlink(path.join(uploadsDir, path.basename(req.user.photo_url)), () => {})
    }
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
    res.json({ user: serializeUser(updated, { includeEmail: true }) })
  } catch (err) {
    fs.unlink(req.file.path, () => {})
    res.status(500).json({ error: 'Bild konnte nicht verarbeitet werden. Bitte ein anderes Bild versuchen.' })
  }
})

router.get('/export', requireAuth, (req, res) => {
  const conversations = db.prepare('SELECT * FROM conversations WHERE user_a_id = ? OR user_b_id = ?').all(req.user.id, req.user.id)
  const messages = conversations.flatMap(conversation => db.prepare('SELECT id, conversation_id, sender_id, body, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at').all(conversation.id))
  const messageIds = messages.map(message => message.id)
  res.setHeader('Content-Disposition', 'attachment; filename="herzklang-export.json"')
  res.json({
    exportedAt: new Date().toISOString(),
    profile: serializeUser(req.user, { includeEmail: true }),
    conversations,
    messages,
    attachments: messageIds.flatMap(messageId => db.prepare('SELECT id,message_id,type,mime_type,size_bytes,created_at FROM message_attachments WHERE message_id=?').all(messageId)),
    likes: db.prepare('SELECT * FROM swipes WHERE from_user_id = ? OR to_user_id = ?').all(req.user.id, req.user.id),
    bookmarks: db.prepare('SELECT * FROM bookmarks WHERE from_user_id = ?').all(req.user.id),
    resonanceAnswers: db.prepare('SELECT question_id, answer, updated_at FROM resonance_answers WHERE user_id = ?').all(req.user.id),
    groupMemberships: db.prepare('SELECT * FROM community_group_members WHERE user_id = ?').all(req.user.id),
    groupPosts: db.prepare('SELECT * FROM community_group_posts WHERE user_id = ?').all(req.user.id),
    location: db.prepare('SELECT latitude,longitude,share_on_map,updated_at FROM user_locations WHERE user_id=?').get(req.user.id) || null
  })
})

router.delete('/', requireAuth, (req, res) => {
  const password = req.body && req.body.password
  if (!password || !bcrypt.compareSync(password, req.user.password_hash)) {
    return res.status(403).json({ error: 'Passwort ist falsch.' })
  }
  const conversationIds = db.prepare('SELECT id FROM conversations WHERE user_a_id = ? OR user_b_id = ?').all(req.user.id, req.user.id).map(row => row.id)
  const attachmentUrls = conversationIds.flatMap(id => db.prepare('SELECT url FROM message_attachments WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?)').all(id).map(row => row.url))
  db.transaction(() => {
    for (const id of conversationIds) {
      db.prepare('DELETE FROM attachment_consents WHERE attachment_id IN (SELECT id FROM message_attachments WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?))').run(id)
      db.prepare('DELETE FROM message_attachments WHERE message_id IN (SELECT id FROM messages WHERE conversation_id=?)').run(id)
      db.prepare('DELETE FROM message_reactions WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = ?)').run(id)
      db.prepare('DELETE FROM message_edits WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = ?)').run(id)
      db.prepare('DELETE FROM message_replies WHERE message_id IN (SELECT id FROM messages WHERE conversation_id = ?) OR reply_to_message_id IN (SELECT id FROM messages WHERE conversation_id = ?)').run(id, id)
      db.prepare('DELETE FROM date_safety_checkins WHERE date_plan_id IN (SELECT id FROM date_plans WHERE conversation_id = ?)').run(id)
      db.prepare('DELETE FROM date_plans WHERE conversation_id = ?').run(id)
      db.prepare('DELETE FROM conversation_reads WHERE conversation_id = ?').run(id)
      db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id)
    }
    db.prepare('DELETE FROM conversations WHERE user_a_id = ? OR user_b_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM reports WHERE reporter_id = ? OR reported_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM matches WHERE user_a_id = ? OR user_b_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM swipes WHERE from_user_id = ? OR to_user_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM bookmarks WHERE from_user_id = ? OR to_user_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM profile_views WHERE viewer_id = ? OR viewed_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM blocks WHERE blocker_id = ? OR blocked_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM status_post_likes WHERE user_id = ? OR post_id IN (SELECT id FROM status_posts WHERE user_id = ?)').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM status_posts WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM pokes WHERE from_user_id = ? OR to_user_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM resonance_answers WHERE user_id = ?').run(req.user.id)
    const ownedGroups = db.prepare('SELECT id FROM community_groups WHERE created_by = ?').all(req.user.id)
    for (const group of ownedGroups) {
      db.prepare('DELETE FROM community_group_posts WHERE group_id = ?').run(group.id)
      db.prepare('DELETE FROM community_group_members WHERE group_id = ?').run(group.id)
      db.prepare('DELETE FROM community_groups WHERE id = ?').run(group.id)
    }
    db.prepare('DELETE FROM community_group_posts WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM community_group_members WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM message_reactions WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM notifications WHERE user_id = ? OR actor_id = ?').run(req.user.id, req.user.id)
    db.prepare('DELETE FROM auth_action_tokens WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM resonance_preferences WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM user_security WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM user_locations WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM user_consents WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM user_preferences WHERE user_id = ?').run(req.user.id)
    db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id)
  })()
  attachmentUrls.forEach(url => fs.unlink(path.join(__dirname, '..', url), () => {}))
  if (req.user.photo_url && req.user.photo_url.startsWith('/uploads/')) {
    fs.unlink(path.join(uploadsDir, path.basename(req.user.photo_url)), () => {})
  }
  res.clearCookie('authToken', { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  res.json({ deleted: true })
})

module.exports = router
