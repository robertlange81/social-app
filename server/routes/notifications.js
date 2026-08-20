const express = require('express')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { events } = require('../lib/notifications')

const router = express.Router()
const serialize = row => ({ id: row.id, type: row.type, title: row.title, body: row.body, link: row.link, readAt: row.read_at, createdAt: row.created_at })

router.get('/', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.user.id)
  const unreadCount = db.prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL').get(req.user.id).count
  res.json({ notifications: rows.map(serialize), unreadCount })
})
router.post('/read', requireAuth, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.slice(0, 100) : []
  if (ids.length) {
    const update = db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE id = ? AND user_id = ?")
    db.transaction(() => ids.forEach(id => update.run(id, req.user.id)))()
  } else db.prepare("UPDATE notifications SET read_at = datetime('now') WHERE user_id = ? AND read_at IS NULL").run(req.user.id)
  res.json({ read: true })
})
router.get('/events', requireAuth, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream'); res.setHeader('Cache-Control', 'no-cache, no-transform'); res.flushHeaders()
  const eventName = `user:${req.user.id}`; const send = item => res.write(`event: notification\ndata: ${JSON.stringify(item)}\n\n`)
  const keepAlive = setInterval(() => res.write(': keep-alive\n\n'), 25000)
  events.on(eventName, send); req.on('close', () => { clearInterval(keepAlive); events.off(eventName, send) })
})
module.exports = router
