require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const crypto = require('crypto')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const { rateLimit } = require('express-rate-limit')

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET muss in Produktion gesetzt sein.')
  console.warn('WARNUNG: JWT_SECRET ist nicht gesetzt, verwende unsicheren Dev-Default. Bitte server/.env anlegen (siehe .env.example).')
  process.env.JWT_SECRET = 'dev-only-insecure-secret'
}

const app = express()
app.disable('x-powered-by')
if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1)
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:8080')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error('Origin ist nicht erlaubt.'))
  },
  credentials: true
}))
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
})
app.use(cookieParser())
app.use(express.json({ limit: '100kb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

const apiLimiter = rateLimit({ windowMs: 60 * 1000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false })
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api', apiLimiter)
app.use('/api/auth', authLimiter, require('./routes/auth'))
app.use('/api/me', require('./routes/me'))
app.use('/api/users', require('./routes/users'))
app.use('/api/discover', require('./routes/discover'))
app.use('/api/swipes', require('./routes/swipes'))
app.use('/api/matches', require('./routes/matches'))
app.use('/api/search', require('./routes/search'))
app.use('/api/bookmarks', require('./routes/bookmarks'))
app.use('/api/likes', require('./routes/likes'))
app.use('/api/conversations', require('./routes/conversations'))
app.use('/api/blocks', require('./routes/blocks'))
app.use('/api/reports', require('./routes/reports'))

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Interner Serverfehler.' })
})

const PORT = process.env.PORT || 4000
if (require.main === module) {
  app.listen(PORT, () => console.log(`Partnerbörse-API läuft auf http://localhost:${PORT}`))
}

module.exports = app
