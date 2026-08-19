const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(dataDir, 'app.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// Releases before conversations were introduced stored messages directly on a
// match. Migrate that schema before schema.sql creates indexes for the new
// conversation_id column. The match id is reused as conversation id so no
// message references are lost.
const messagesTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'messages'").get()
if (messagesTable) {
  const messageColumns = db.prepare('PRAGMA table_info(messages)').all().map(column => column.name)
  if (messageColumns.includes('match_id') && !messageColumns.includes('conversation_id')) {
    db.transaction(() => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS conversations (
          id TEXT PRIMARY KEY,
          user_a_id TEXT NOT NULL REFERENCES users(id),
          user_b_id TEXT NOT NULL REFERENCES users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          UNIQUE(user_a_id, user_b_id)
        );
        INSERT OR IGNORE INTO conversations (id, user_a_id, user_b_id, created_at)
          SELECT id, user_a_id, user_b_id, created_at FROM matches;
        CREATE TABLE messages_migrated (
          id TEXT PRIMARY KEY,
          conversation_id TEXT NOT NULL REFERENCES conversations(id),
          sender_id TEXT NOT NULL REFERENCES users(id),
          body TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO messages_migrated (id, conversation_id, sender_id, body, created_at)
          SELECT id, match_id, sender_id, body, created_at FROM messages;
        DROP TABLE messages;
        ALTER TABLE messages_migrated RENAME TO messages;
      `)
    })()
  }
}

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
db.exec(schema)

module.exports = db
