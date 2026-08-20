const express = require('express')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')
const requireAuth = require('../middleware/auth')
const { validateUserContent } = require('../lib/contentSafety')
const { serializeUser } = require('../lib/users')

const router = express.Router()
const MAX_POST_LENGTH = 500

function serializePost (row) {
  return {
    id: row.post_id,
    body: row.body,
    createdAt: row.post_created_at,
    likeCount: row.like_count,
    likedByMe: !!row.liked_by_me,
    author: serializeUser(row)
  }
}

router.get('/', requireAuth, (req, res) => {
  const requestedLimit = Number.parseInt(req.query.limit, 10)
  const requestedOffset = Number.parseInt(req.query.offset, 10)
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20
  const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0
  const posts = db.prepare(`
    SELECT p.id AS post_id, p.body, p.created_at AS post_created_at, u.*,
      (SELECT COUNT(*) FROM status_post_likes pl WHERE pl.post_id = p.id) AS like_count,
      EXISTS(SELECT 1 FROM status_post_likes pl WHERE pl.post_id = p.id AND pl.user_id = @me) AS liked_by_me
    FROM status_posts p
    JOIN users u ON u.id = p.user_id
    WHERE NOT EXISTS (
      SELECT 1 FROM blocks b
      WHERE (b.blocker_id = @me AND b.blocked_id = p.user_id)
         OR (b.blocker_id = p.user_id AND b.blocked_id = @me)
    )
    ORDER BY p.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ me: req.user.id, limit, offset })
  res.json({ posts: posts.map(serializePost), hasMore: posts.length === limit })
})

router.post('/', requireAuth, (req, res) => {
  const body = typeof req.body.body === 'string' ? req.body.body.trim() : ''
  if (!body) return res.status(400).json({ error: 'Der Beitrag darf nicht leer sein.' })
  if (body.length > MAX_POST_LENGTH) return res.status(400).json({ error: `Der Beitrag darf maximal ${MAX_POST_LENGTH} Zeichen lang sein.` })
  const safetyError = validateUserContent(body)
  if (safetyError) return res.status(400).json({ error: safetyError })
  const id = uuidv4()
  db.prepare('INSERT INTO status_posts (id, user_id, body) VALUES (?, ?, ?)').run(id, req.user.id, body)
  const row = db.prepare(`
    SELECT p.id AS post_id, p.body, p.created_at AS post_created_at, u.*, 0 AS like_count, 0 AS liked_by_me
    FROM status_posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?
  `).get(id)
  res.status(201).json({ post: serializePost(row) })
})

router.post('/:id/like', requireAuth, (req, res) => {
  const post = db.prepare('SELECT user_id FROM status_posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden.' })
  const blocked = db.prepare(`SELECT 1 FROM blocks WHERE
    (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)`)
    .get(req.user.id, post.user_id, post.user_id, req.user.id)
  if (blocked) return res.status(403).json({ error: 'Dieser Beitrag ist für dich nicht verfügbar.' })
  const existing = db.prepare('SELECT 1 FROM status_post_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.user.id)
  if (existing) db.prepare('DELETE FROM status_post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.user.id)
  else db.prepare('INSERT INTO status_post_likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.user.id)
  const count = db.prepare('SELECT COUNT(*) AS count FROM status_post_likes WHERE post_id = ?').get(req.params.id).count
  res.json({ liked: !existing, likeCount: count })
})

router.delete('/:id', requireAuth, (req, res) => {
  const post = db.prepare('SELECT user_id FROM status_posts WHERE id = ?').get(req.params.id)
  if (!post) return res.status(404).json({ error: 'Beitrag nicht gefunden.' })
  if (post.user_id !== req.user.id) return res.status(403).json({ error: 'Du kannst nur eigene Beiträge löschen.' })
  db.transaction(() => {
    db.prepare('DELETE FROM status_post_likes WHERE post_id = ?').run(req.params.id)
    db.prepare('DELETE FROM status_posts WHERE id = ?').run(req.params.id)
  })()
  res.json({ deleted: true })
})

module.exports = router
