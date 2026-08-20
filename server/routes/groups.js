const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { serializeUser } = require('../lib/users')
const { validateUserContent } = require('../lib/contentSafety')

const router = express.Router()
const clean = value => typeof value === 'string' ? value.trim() : ''

router.get('/', requireAuth, (req, res) => {
  const groups = db.prepare(`SELECT g.*,
    (SELECT COUNT(*) FROM community_group_members gm WHERE gm.group_id = g.id) AS member_count,
    EXISTS(SELECT 1 FROM community_group_members gm WHERE gm.group_id = g.id AND gm.user_id = ?) AS joined
    FROM community_groups g ORDER BY member_count DESC, g.created_at DESC`).all(req.user.id)
  res.json({ groups: groups.map(group => ({ id: group.id, name: group.name, description: group.description, city: group.city, createdBy: group.created_by, createdAt: group.created_at, memberCount: group.member_count, joined: !!group.joined })) })
})

router.post('/', requireAuth, (req, res) => {
  const name = clean(req.body.name); const description = clean(req.body.description); const city = clean(req.body.city)
  if (name.length < 3 || name.length > 80) return res.status(400).json({ error: 'Der Gruppenname braucht 3 bis 80 Zeichen.' })
  if (!description || description.length > 500 || city.length > 100) return res.status(400).json({ error: 'Beschreibung oder Ort ist ungültig.' })
  const id = uuidv4()
  try {
    db.transaction(() => {
      db.prepare('INSERT INTO community_groups (id, name, description, city, created_by) VALUES (?, ?, ?, ?, ?)').run(id, name, description, city || null, req.user.id)
      db.prepare('INSERT INTO community_group_members (group_id, user_id) VALUES (?, ?)').run(id, req.user.id)
    })()
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Diesen Gruppennamen gibt es bereits.' })
    throw error
  }
  res.status(201).json({ id })
})

router.post('/:id/membership', requireAuth, (req, res) => {
  if (!db.prepare('SELECT 1 FROM community_groups WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Gruppe nicht gefunden.' })
  db.prepare('INSERT OR IGNORE INTO community_group_members (group_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id)
  res.status(201).json({ joined: true })
})

router.delete('/:id/membership', requireAuth, (req, res) => {
  db.prepare('DELETE FROM community_group_members WHERE group_id = ? AND user_id = ?').run(req.params.id, req.user.id)
  res.json({ joined: false })
})

router.get('/:id/posts', requireAuth, (req, res) => {
  if (!db.prepare('SELECT 1 FROM community_groups WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Gruppe nicht gefunden.' })
  const rows = db.prepare(`SELECT p.id AS post_id, p.body, p.created_at AS post_created_at, u.*
    FROM community_group_posts p JOIN users u ON u.id = p.user_id
    WHERE p.group_id = ? AND NOT EXISTS (SELECT 1 FROM blocks b WHERE
      (b.blocker_id = ? AND b.blocked_id = p.user_id) OR (b.blocker_id = p.user_id AND b.blocked_id = ?))
    ORDER BY p.created_at DESC LIMIT 100`).all(req.params.id, req.user.id, req.user.id)
  res.json({ posts: rows.map(row => ({ id: row.post_id, body: row.body, createdAt: row.post_created_at, author: serializeUser(row) })) })
})

router.post('/:id/posts', requireAuth, (req, res) => {
  const membership = db.prepare('SELECT 1 FROM community_group_members WHERE group_id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (!membership) return res.status(403).json({ error: 'Tritt der Gruppe bei, um zu schreiben.' })
  const body = clean(req.body.body)
  if (!body || body.length > 1000) return res.status(400).json({ error: 'Der Beitrag braucht 1 bis 1000 Zeichen.' })
  const safetyError = validateUserContent(body)
  if (safetyError) return res.status(400).json({ error: safetyError })
  const id = uuidv4()
  db.prepare('INSERT INTO community_group_posts (id, group_id, user_id, body) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.user.id, body)
  res.status(201).json({ id })
})

module.exports = router
