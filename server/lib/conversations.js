const { v4: uuidv4 } = require('uuid')
const db = require('../db')

function sortPair (a, b) {
  return [a, b].sort()
}

function isBlocked (userA, userB) {
  const row = db.prepare(`
    SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)
  `).get(userA, userB, userB, userA)
  return !!row
}

function findOrCreateConversation (userA, userB) {
  const [a, b] = sortPair(userA, userB)
  db.prepare(`
    INSERT INTO conversations (id, user_a_id, user_b_id) VALUES (?, ?, ?)
    ON CONFLICT(user_a_id, user_b_id) DO NOTHING
  `).run(uuidv4(), a, b)
  return db.prepare('SELECT * FROM conversations WHERE user_a_id = ? AND user_b_id = ?').get(a, b)
}

function getOtherUserId (conversation, myId) {
  return conversation.user_a_id === myId ? conversation.user_b_id : conversation.user_a_id
}

function hasMatch (userA, userB) {
  const [a, b] = sortPair(userA, userB)
  const row = db.prepare('SELECT 1 FROM matches WHERE user_a_id = ? AND user_b_id = ?').get(a, b)
  return !!row
}

module.exports = { isBlocked, findOrCreateConversation, getOtherUserId, hasMatch }
