CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK(species IN ('dog','cat')),
  breed TEXT,
  gender TEXT NOT NULL CHECK(gender IN ('male','female')),
  birthdate TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK(purpose IN ('breeding','playmate','both')),
  city TEXT,
  bio TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY,
  from_pet_id TEXT NOT NULL REFERENCES pets(id),
  to_pet_id TEXT NOT NULL REFERENCES pets(id),
  direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_pet_id, to_pet_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  pet_a_id TEXT NOT NULL REFERENCES pets(id),
  pet_b_id TEXT NOT NULL REFERENCES pets(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(pet_a_id, pet_b_id)
);

-- Unterhaltungen sind immer zwischen zwei HALTERN (Usern), unabhängig davon,
-- ob es (schon) ein Match zwischen zwei ihrer Tiere gibt. So ist Chat mit
-- anderen Nutzern generell möglich, nicht nur nach einem Match.
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id),
  user_b_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  sender_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversation_reads (
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  read_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id),
  reported_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blocks (
  id TEXT PRIMARY KEY,
  blocker_id TEXT NOT NULL REFERENCES users(id),
  blocked_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_pet_id TEXT NOT NULL REFERENCES pets(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_user_id, to_pet_id)
);

CREATE TABLE IF NOT EXISTS profile_views (
  id TEXT PRIMARY KEY,
  viewer_id TEXT NOT NULL REFERENCES users(id),
  viewed_pet_id TEXT NOT NULL REFERENCES pets(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pets_owner ON pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_swipes_from ON swipes(from_pet_id);
CREATE INDEX IF NOT EXISTS idx_matches_pet_a ON matches(pet_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_pet_b ON matches(pet_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(user_b_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_from ON bookmarks(from_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_pet_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
