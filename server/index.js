require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

if (!process.env.JWT_SECRET) {
  console.warn('WARNUNG: JWT_SECRET ist nicht gesetzt, verwende unsicheren Dev-Default. Bitte server/.env anlegen (siehe .env.example).')
  process.env.JWT_SECRET = 'dev-only-insecure-secret'
}

const app = express()
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth', require('./routes/auth'))
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

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message || 'Interner Serverfehler.' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Partnerbörse-API läuft auf http://localhost:${PORT}`))
