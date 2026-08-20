const EventEmitter = require('events')
const { v4: uuidv4 } = require('uuid')
const db = require('../db')

const events = new EventEmitter()
events.setMaxListeners(500)

function createNotification ({ userId, actorId = null, type, title, body = null, link = null }) {
  if (!userId || userId === actorId) return null
  const preferences = db.prepare('SELECT notify_matches,notify_messages,notify_social FROM user_preferences WHERE user_id=?').get(userId)
  if (preferences) {
    if (type === 'match' && !preferences.notify_matches) return null
    if (type === 'message' && !preferences.notify_messages) return null
    if (!['match', 'message', 'security'].includes(type) && !preferences.notify_social) return null
  }
  const notification = { id: uuidv4(), userId, actorId, type, title, body, link, createdAt: new Date().toISOString() }
  db.prepare('INSERT INTO notifications (id, user_id, actor_id, type, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .run(notification.id, userId, actorId, type, title, body, link, notification.createdAt)
  events.emit(`user:${userId}`, notification)
  return notification
}

module.exports = { events, createNotification }
