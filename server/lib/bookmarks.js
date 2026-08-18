const db = require('../db')

function getBookmarkedIdSet (userId) {
  const rows = db.prepare('SELECT to_pet_id FROM bookmarks WHERE from_user_id = ?').all(userId)
  return new Set(rows.map(r => r.to_pet_id))
}

function attachBookmarked (pets, userId) {
  const bookmarked = getBookmarkedIdSet(userId)
  return pets.map(p => Object.assign({}, p, { isBookmarked: bookmarked.has(p.id) }))
}

module.exports = { getBookmarkedIdSet, attachBookmarked }
