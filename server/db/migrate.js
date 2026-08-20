const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const schemaPath = path.join(__dirname, 'schema.sql')

function tableExists (db, name) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(name)
}

function migrateLegacyMessages (db) {
  if (!tableExists(db, 'messages')) return
  const columns = db.prepare('PRAGMA table_info(messages)').all().map(column => column.name)
  if (!columns.includes('match_id') || columns.includes('conversation_id')) return
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
}

function checksum (source) {
  return crypto.createHash('sha256').update(source).digest('hex')
}

function createBackup (db, dbPath) {
  if (!dbPath || dbPath === ':memory:' || !fs.existsSync(dbPath)) return null
  const hasApplicationData = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='schema_migrations' LIMIT 1").get()
  if (!hasApplicationData) return null
  const backupDir = path.join(path.dirname(dbPath), 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.join(backupDir, `${path.basename(dbPath)}.${timestamp}.bak`)
  db.prepare('VACUUM INTO ?').run(backupPath)
  return backupPath
}

function runMigrations (db, { dbPath, logger = console } = {}) {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    checksum TEXT NOT NULL,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)
  const baseline = fs.readFileSync(schemaPath, 'utf8')
  const migrations = [
    { version: 1, name: 'legacy-match-messages', source: migrateLegacyMessages.toString(), up: migrateLegacyMessages },
    { version: 2, name: 'herzklang-baseline-2026-08-20', source: baseline, up: database => database.exec(baseline) }
  ]
  const applied = new Map(db.prepare('SELECT version,name,checksum FROM schema_migrations').all().map(item => [item.version, item]))
  let backupCreated = false
  for (const migration of migrations) {
    const digest = checksum(migration.source)
    const previous = applied.get(migration.version)
    if (previous) {
      if (previous.name !== migration.name || previous.checksum !== digest) throw new Error(`Migration ${migration.version} wurde nachträglich verändert.`)
      continue
    }
    if (!backupCreated) {
      const backupPath = createBackup(db, dbPath)
      if (backupPath) logger.info(`Datenbank-Backup vor Migration: ${backupPath}`)
      backupCreated = true
    }
    db.transaction(() => {
      migration.up(db)
      db.prepare('INSERT INTO schema_migrations (version,name,checksum) VALUES (?,?,?)').run(migration.version, migration.name, digest)
    })()
    logger.info(`Migration ${migration.version} angewendet: ${migration.name}`)
  }
  return db.prepare('SELECT version,name,checksum,applied_at FROM schema_migrations ORDER BY version').all()
}

module.exports = { runMigrations }
