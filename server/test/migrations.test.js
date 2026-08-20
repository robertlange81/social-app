const test = require('node:test')
const assert = require('node:assert/strict')
const Database = require('better-sqlite3')
const { runMigrations } = require('../db/migrate')

test('migrations preserve legacy match messages and are idempotent', () => {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  db.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, handle TEXT UNIQUE NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, birthdate TEXT NOT NULL, gender TEXT NOT NULL, seeking_gender TEXT NOT NULL, party TEXT NOT NULL, city TEXT, bio TEXT, photo_url TEXT, political_consent_at TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE matches (id TEXT PRIMARY KEY, user_a_id TEXT NOT NULL REFERENCES users(id), user_b_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_a_id,user_b_id));
    CREATE TABLE messages (id TEXT PRIMARY KEY, match_id TEXT NOT NULL REFERENCES matches(id), sender_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    INSERT INTO users (id,handle,email,password_hash,birthdate,gender,seeking_gender,party,political_consent_at) VALUES ('a','a','a@example.com','x','1990-01-01','male','all','SPD','now'),('b','b','b@example.com','x','1990-01-01','female','all','SPD','now');
    INSERT INTO matches (id,user_a_id,user_b_id) VALUES ('match-1','a','b');
    INSERT INTO messages (id,match_id,sender_id,body) VALUES ('message-1','match-1','a','bleibt erhalten');
  `)
  const first = runMigrations(db, { logger: { info: () => {} } })
  const second = runMigrations(db, { logger: { info: () => {} } })
  assert.equal(first.length, 2)
  assert.equal(second.length, 2)
  assert.deepEqual(db.prepare('SELECT conversation_id,body FROM messages').get(), { conversation_id: 'match-1', body: 'bleibt erhalten' })
  assert.ok(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='user_consents'").get())
  db.close()
})
