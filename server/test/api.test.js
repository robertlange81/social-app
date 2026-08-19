const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const request = require('supertest')

const dbPath = path.join(os.tmpdir(), `herzklang-${process.pid}.db`)
process.env.DB_PATH = dbPath
process.env.JWT_SECRET = 'test-only-secret'
process.env.CORS_ORIGINS = 'http://localhost:8080'
const app = require('../index')
const db = require('../db')

test.after(() => {
  db.close()
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(`${dbPath}${suffix}`) } catch (_) {}
  }
})

test('health endpoint exposes no framework header', async () => {
  const response = await request(app).get('/api/health').expect(200)
  assert.equal(response.body.status, 'ok')
  assert.equal(response.headers['x-powered-by'], undefined)
  assert.ok(response.headers['x-request-id'])
})

test('cookie session covers signup, authenticated request and logout', async () => {
  const agent = request.agent(app)
  const signup = await agent.post('/api/auth/signup').send({
    handle: 'Testperson', email: 'test@example.test', password: 'secret1',
    birthdate: '1990-01-01', gender: 'female', seekingGender: 'all', party: 'SPD',
    consentTos: true, consentPolitical: true
  }).expect(201)
  assert.equal(signup.body.token, undefined)
  assert.match(signup.headers['set-cookie'][0], /HttpOnly/)
  await agent.get('/api/me').expect(200)
  await agent.post('/api/auth/logout').expect(200)
  await agent.get('/api/me').expect(401)
})

test('validation rejects oversized signup fields', async () => {
  const response = await request(app).post('/api/auth/signup').send({
    handle: 'x'.repeat(51), email: 'long@example.test', password: 'secret1'
  }).expect(400)
  assert.match(response.body.error, /maximal 50/)
})
