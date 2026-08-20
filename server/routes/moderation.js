const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')

const router = express.Router()
function requireAdmin (req, res, next) {
  const admins = String(process.env.ADMIN_EMAILS || '').split(',').map(item => item.trim().toLowerCase()).filter(Boolean)
  if (!admins.includes(req.user.email.toLowerCase())) return res.status(403).json({ error: 'Administrator-Zugriff erforderlich.' })
  next()
}
router.use(requireAuth, requireAdmin)
router.get('/reports', (req, res) => {
  const reports = db.prepare(`SELECT r.*, reporter.handle AS reporter_handle, reported.handle AS reported_handle
    FROM reports r JOIN users reporter ON reporter.id=r.reporter_id JOIN users reported ON reported.id=r.reported_id ORDER BY r.created_at DESC LIMIT 200`).all()
  res.json({ reports })
})
router.patch('/reports/:id', (req, res) => {
  const status = req.body && req.body.status
  if (!['open', 'reviewing', 'resolved', 'dismissed'].includes(status)) return res.status(400).json({ error: 'Ungültiger Status.' })
  if (!db.prepare('SELECT 1 FROM reports WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Meldung nicht gefunden.' })
  db.prepare('UPDATE reports SET status = ? WHERE id = ?').run(status, req.params.id)
  db.prepare('INSERT INTO moderation_audit (id, actor_user_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'report_status_changed', 'report', req.params.id, JSON.stringify({ status }))
  res.json({ status })
})
router.patch('/users/:id/security', (req, res) => {
  if (!db.prepare('SELECT 1 FROM users WHERE id=?').get(req.params.id)) return res.status(404).json({ error: 'Nutzer nicht gefunden.' })
  const verificationLevel = req.body.verificationLevel
  const suspendHours = Number(req.body.suspendHours || 0)
  if (verificationLevel && !['none', 'email', 'profile'].includes(verificationLevel)) return res.status(400).json({ error: 'Ungültige Verifikation.' })
  if (!Number.isFinite(suspendHours) || suspendHours < 0 || suspendHours > 8760) return res.status(400).json({ error: 'Ungültige Sperrdauer.' })
  db.prepare(`INSERT INTO user_security (user_id, verification_level, suspended_until, suspension_reason) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET verification_level=COALESCE(?,verification_level), suspended_until=excluded.suspended_until, suspension_reason=excluded.suspension_reason`)
    .run(req.params.id, verificationLevel || 'none', suspendHours ? new Date(Date.now() + suspendHours * 3600000).toISOString() : null, String(req.body.reason || '').slice(0, 500) || null, verificationLevel || null)
  db.prepare('INSERT INTO moderation_audit (id, actor_user_id, action, target_user_id, target_type, target_id, details) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(uuidv4(), req.user.id, 'user_security_changed', req.params.id, 'user', req.params.id, JSON.stringify({ verificationLevel, suspendHours }))
  res.json({ updated: true })
})
module.exports = router
