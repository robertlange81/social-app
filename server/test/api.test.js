const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const os = require('os')
const path = require('path')
const request = require('supertest')

const dbPath = path.join(os.tmpdir(), `herzklang-${process.pid}.db`)
process.env.DB_PATH = dbPath
process.env.NODE_ENV = 'test'
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
  assert.ok(signup.body.verificationToken)
  assert.match(signup.headers['set-cookie'][0], /HttpOnly/)
  await agent.get('/api/me').expect(200)
  await agent.post('/api/auth/verify-email').send({ token: signup.body.verificationToken }).expect(200)
  const resetRequest = await agent.post('/api/auth/request-password-reset').send({ email: 'test@example.test' }).expect(200)
  assert.ok(resetRequest.body.devToken)
  await agent.post('/api/auth/reset-password').send({ token: resetRequest.body.devToken, password: 'new-secret-1' }).expect(200)
  await agent.post('/api/auth/logout').expect(200)
  await agent.get('/api/me').expect(401)
  await agent.post('/api/auth/login').send({ email: 'test@example.test', password: 'new-secret-1' }).expect(200)
})

test('validation rejects oversized signup fields', async () => {
  const response = await request(app).post('/api/auth/signup').send({
    handle: 'x'.repeat(51), email: 'long@example.test', password: 'secret1'
  }).expect(400)
  assert.match(response.body.error, /maximal 50/)
})

test('social feed supports posts, likes, pokes and ownership checks', async () => {
  const anna = request.agent(app)
  const ben = request.agent(app)
  const signup = (agent, handle, email) => agent.post('/api/auth/signup').send({
    handle, email, password: 'secret1', birthdate: '1990-01-01',
    gender: 'female', seekingGender: 'all', party: 'SPD',
    consentTos: true, consentPolitical: true
  })
  const annaSignup = await signup(anna, 'AnnaFeed', 'anna-feed@example.test').expect(201)
  const benSignup = await signup(ben, 'BenFeed', 'ben-feed@example.test').expect(201)

  const created = await anna.post('/api/feed').send({ body: 'Hallo Pinnwand!' }).expect(201)
  assert.equal(created.body.post.author.handle, 'AnnaFeed')
  assert.equal(created.body.post.body, 'Hallo Pinnwand!')
  const postId = created.body.post.id

  const feed = await ben.get('/api/feed').expect(200)
  assert.ok(feed.body.posts.some(post => post.id === postId))
  const liked = await ben.post(`/api/feed/${postId}/like`).expect(200)
  assert.deepEqual(liked.body, { liked: true, likeCount: 1 })
  await ben.delete(`/api/feed/${postId}`).expect(403)

  await ben.post('/api/pokes').send({ toUserId: annaSignup.body.user.id }).expect(201)
  const pokes = await anna.get('/api/pokes').expect(200)
  assert.equal(pokes.body.pokes[0].id, benSignup.body.user.id)
  assert.equal(pokes.body.pokes[0].handle, 'BenFeed')

  await anna.delete(`/api/feed/${postId}`).expect(200)
  await ben.post('/api/feed').send({ body: 'x'.repeat(501) }).expect(400)
})

test('resonance, groups and enhanced chat flows enforce collaboration rules', async () => {
  const alice = request.agent(app); const bob = request.agent(app)
  const signup = (agent, handle, email) => agent.post('/api/auth/signup').send({
    handle, email, password: 'secret1', birthdate: '1990-01-01', gender: 'female', seekingGender: 'all', party: 'SPD', consentTos: true, consentPolitical: true
  })
  const aliceUser = (await signup(alice, 'AliceSocial', 'alice-social@example.test').expect(201)).body.user
  const bobUser = (await signup(bob, 'BobSocial', 'bob-social@example.test').expect(201)).body.user

  await alice.put('/api/resonance/me').send({ answers: { free_sunday: 'Unterwegs sein', conflict: 'Humor hilft' }, preferences: { free_sunday: { importance: 3, isPrivate: true }, conflict: { importance: 1, isPrivate: false } } }).expect(200)
  await bob.put('/api/resonance/me').send({ answers: { free_sunday: 'Unterwegs sein', conflict: 'Erst nachdenken' } }).expect(200)
  const comparison = await alice.get(`/api/resonance/compare/${bobUser.id}`).expect(200)
  assert.equal(comparison.body.score, 75); assert.equal(comparison.body.compared, 2); assert.equal(comparison.body.comparisons[0].mine, null)

  const group = await alice.post('/api/groups').send({ name: 'Testgruppe', description: 'Eine richtige Testgruppe' }).expect(201)
  await bob.post(`/api/groups/${group.body.id}/posts`).send({ body: 'Noch kein Mitglied' }).expect(403)
  await bob.post(`/api/groups/${group.body.id}/membership`).expect(201)
  await bob.post(`/api/groups/${group.body.id}/posts`).send({ body: 'Hallo Gruppe!' }).expect(201)
  const posts = await alice.get(`/api/groups/${group.body.id}/posts`).expect(200)
  assert.equal(posts.body.posts[0].body, 'Hallo Gruppe!')

  const conversation = (await alice.post('/api/conversations').send({ toUserId: bobUser.id }).expect(201)).body.conversation
  const first = (await alice.post(`/api/conversations/${conversation.id}/messages`).send({ body: 'Erste Nachricht' }).expect(201)).body.message
  const reply = (await bob.post(`/api/conversations/${conversation.id}/messages`).send({ body: 'Meine Antwort', replyToId: first.id }).expect(201)).body.message
  assert.equal(reply.replyTo.id, first.id)
  const reaction = await bob.post(`/api/conversations/${conversation.id}/messages/${first.id}/reactions`).send({ emoji: '❤️' }).expect(200)
  assert.equal(reaction.body.message.reactions[0].count, 1)
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  const media = await alice.post(`/api/conversations/${conversation.id}/media`).field('requireConsent', 'true').attach('media', png, { filename: 'test.png', contentType: 'image/png' }).expect(201)
  const mediaForBob = await bob.get(`/api/conversations/${conversation.id}/messages`).expect(200)
  const hiddenAttachment = mediaForBob.body.messages.find(message => message.id === media.body.message.id).attachment
  assert.equal(hiddenAttachment.approved, false); assert.equal(hiddenAttachment.url, null)
  await bob.post(`/api/conversations/${conversation.id}/attachments/${hiddenAttachment.id}/consent`).expect(200)
  const visibleMedia = await bob.get(`/api/conversations/${conversation.id}/messages`).expect(200)
  assert.match(visibleMedia.body.messages.find(message => message.id === media.body.message.id).attachment.url, /\/uploads\/chat\//)
  const notifications = await bob.get('/api/notifications').expect(200)
  assert.ok(notifications.body.unreadCount >= 1)
  await bob.post('/api/notifications/read').send({}).expect(200)
  await alice.patch(`/api/conversations/${conversation.id}/messages/${first.id}`).send({ body: 'Bearbeitete Nachricht' }).expect(200)
  const search = await alice.get(`/api/conversations/${conversation.id}/messages/search`).query({ q: 'Bearbeitete' }).expect(200)
  assert.equal(search.body.messages[0].edited, true)

  const startsAt = new Date(Date.now() + 86400000).toISOString()
  const plan = await alice.post(`/api/conversations/${conversation.id}/date-plans`).send({ startsAt, place: 'Café Test', activity: 'Kaffee', note: 'Fensterplatz' }).expect(201)
  await alice.patch(`/api/conversations/${conversation.id}/date-plans/${plan.body.id}`).send({ status: 'accepted' }).expect(403)
  await bob.patch(`/api/conversations/${conversation.id}/date-plans/${plan.body.id}`).send({ status: 'accepted' }).expect(200)
  const plans = await alice.get(`/api/conversations/${conversation.id}/date-plans`).expect(200)
  assert.equal(plans.body.plans[0].status, 'accepted')
  const calendar = await alice.get(`/api/conversations/${conversation.id}/date-plans/${plan.body.id}/calendar.ics`).expect(200)
  assert.match(calendar.text, /BEGIN:VCALENDAR/)
  await alice.post(`/api/conversations/${conversation.id}/date-plans/${plan.body.id}/checkin`).send({ status: 'safe_home' }).expect(200)
  await alice.post(`/api/conversations/${conversation.id}/messages`).send({ body: 'https://a.test https://b.test https://c.test https://d.test' }).expect(400)
  await alice.put('/api/me/location').send({ latitude: 52.5208, longitude: 13.4095, shareOnMap: true }).expect(200)
  await bob.put('/api/me/location').send({ latitude: 52.6208, longitude: 13.4095, shareOnMap: true }).expect(200)
  const map = await alice.get('/api/search/map').expect(200)
  assert.ok(map.body.profiles.some(profile => profile.id === bobUser.id && profile.distanceKm > 0))
  const nearby = await alice.get('/api/search').query({ radiusKm: 25 }).expect(200)
  assert.ok(nearby.body.profiles.some(profile => profile.id === bobUser.id))
  await alice.delete(`/api/conversations/${conversation.id}/messages/${first.id}`).expect(200)
  await bob.post('/api/reports').send({ userId: aliceUser.id, reason: 'other', details: 'Moderationstest' }).expect(201)
  process.env.ADMIN_EMAILS = 'alice-social@example.test'
  const moderation = await alice.get('/api/moderation/reports').expect(200)
  assert.ok(moderation.body.reports.length >= 1)
  await alice.patch(`/api/moderation/users/${bobUser.id}/security`).send({ verificationLevel: 'profile', suspendHours: 0 }).expect(200)
  await alice.delete(`/api/conversations/${conversation.id}`).expect(200)
  assert.ok(aliceUser.id)
})
