const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const request = require('supertest')

const dbPath = path.join(os.tmpdir(), `pfotenmatch-${process.pid}.db`)
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

test('cookie session and pet lifecycle work', async () => {
  const agent = request.agent(app)
  const signup = await agent.post('/api/auth/signup').send({
    handle: 'Tierhalter', email: 'tier@example.test', password: 'secret1', city: 'Berlin'
  }).expect(201)
  assert.equal(signup.body.token, undefined)
  assert.match(signup.headers['set-cookie'][0], /HttpOnly/)
  const pet = await agent.post('/api/pets').send({
    name: 'Luna', species: 'dog', gender: 'female', birthdate: '2020-01-01', purpose: 'playmate'
  }).expect(201)
  await agent.delete(`/api/pets/${pet.body.pet.id}`).expect(200)
  await agent.post('/api/auth/logout').expect(200)
  await agent.get('/api/me').expect(401)
})

test('validation rejects oversized owner names', async () => {
  const response = await request(app).post('/api/auth/signup').send({
    handle: 'x'.repeat(51), email: 'long@example.test', password: 'secret1'
  }).expect(400)
  assert.match(response.body.error, /maximal 50/)
})
