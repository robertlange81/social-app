const jwt = require('jsonwebtoken')
const db = require('../db')

module.exports = function requireAuth (req, res, next) {
  const header = req.headers.authorization || ''
  const token = (req.cookies && req.cookies.authToken) || (header.startsWith('Bearer ') ? header.slice(7) : null)
  if (!token) return res.status(401).json({ error: 'Nicht angemeldet.' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    if (!user) return res.status(401).json({ error: 'Nutzer nicht gefunden.' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token.' })
  }
}
