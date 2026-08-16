const db = require('../db')

function getBookmarkedIdSet (userId) {
  const rows = db.prepare('SELECT to_user_id FROM bookmarks WHERE from_user_id = ?').all(userId)
  return new Set(rows.map(r => r.to_user_id))
}

function attachBookmarked (profiles, userId) {
  const bookmarked = getBookmarkedIdSet(userId)
  return profiles.map(p => Object.assign({}, p, { isBookmarked: bookmarked.has(p.id) }))
}

module.exports = { getBookmarkedIdSet, attachBookmarked }
