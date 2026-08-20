CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  birthdate TEXT NOT NULL,
  gender TEXT NOT NULL,
  seeking_gender TEXT NOT NULL,
  party TEXT NOT NULL,
  city TEXT,
  bio TEXT,
  photo_url TEXT,
  political_consent_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS swipes (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id TEXT NOT NULL REFERENCES users(id),
  direction TEXT NOT NULL CHECK(direction IN ('like','pass')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  user_a_id TEXT NOT NULL REFERENCES users(id),
  user_b_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_a_id, user_b_id)
);

-- Unterhaltungen sind immer zwischen zwei Nutzern, unabhängig davon, ob es
-- (schon) ein Match gibt. So ist Chat mit anderen Nutzern generell möglich,
-- nicht nur nach einem Match.
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
  to_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS profile_views (
  id TEXT PRIMARY KEY,
  viewer_id TEXT NOT NULL REFERENCES users(id),
  viewed_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS status_posts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS status_post_likes (
  post_id TEXT NOT NULL REFERENCES status_posts(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS pokes (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL REFERENCES users(id),
  to_user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE IF NOT EXISTS resonance_answers (
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS community_groups (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  city TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS community_group_members (
  group_id TEXT NOT NULL REFERENCES community_groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(group_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_group_posts (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES community_groups(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS message_replies (
  message_id TEXT PRIMARY KEY REFERENCES messages(id),
  reply_to_message_id TEXT NOT NULL REFERENCES messages(id)
);

CREATE TABLE IF NOT EXISTS message_reactions (
  message_id TEXT NOT NULL REFERENCES messages(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  emoji TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS date_plans (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id),
  proposed_by TEXT NOT NULL REFERENCES users(id),
  starts_at TEXT NOT NULL,
  place TEXT NOT NULL,
  activity TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK(status IN ('proposed','accepted','declined','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  responded_at TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  actor_id TEXT REFERENCES users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_action_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK(type IN ('verify_email','reset_password')),
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_security (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  email_verified_at TEXT,
  verification_level TEXT NOT NULL DEFAULT 'none',
  suspended_until TEXT,
  suspension_reason TEXT
);

CREATE TABLE IF NOT EXISTS message_edits (
  message_id TEXT PRIMARY KEY REFERENCES messages(id),
  edited_body TEXT,
  deleted_at TEXT,
  edited_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS moderation_audit (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT,
  action TEXT NOT NULL,
  target_user_id TEXT,
  target_type TEXT,
  target_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS resonance_preferences (
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id TEXT NOT NULL,
  importance INTEGER NOT NULL DEFAULT 1 CHECK(importance BETWEEN 1 AND 3),
  is_private INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(user_id, question_id)
);

CREATE TABLE IF NOT EXISTS date_safety_checkins (
  date_plan_id TEXT NOT NULL REFERENCES date_plans(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK(status IN ('on_my_way','arrived','safe_home')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(date_plan_id, user_id)
);

CREATE TABLE IF NOT EXISTS message_attachments (
  id TEXT PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL REFERENCES messages(id),
  type TEXT NOT NULL CHECK(type IN ('image','audio')),
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  duration_seconds INTEGER,
  requires_consent INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attachment_consents (
  attachment_id TEXT NOT NULL REFERENCES message_attachments(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  approved_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(attachment_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_locations (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  latitude REAL NOT NULL CHECK(latitude BETWEEN -90 AND 90),
  longitude REAL NOT NULL CHECK(longitude BETWEEN -180 AND 180),
  share_on_map INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_consents (
  user_id TEXT NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  granted_at TEXT,
  revoked_at TEXT,
  PRIMARY KEY(user_id, consent_type)
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  notify_matches INTEGER NOT NULL DEFAULT 1,
  notify_messages INTEGER NOT NULL DEFAULT 1,
  notify_social INTEGER NOT NULL DEFAULT 1,
  dark_mode INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_shared ON user_locations(share_on_map);
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_swipes_from ON swipes(from_user_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_a ON conversations(user_a_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_b ON conversations(user_b_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_from ON bookmarks(from_user_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_status_posts_created ON status_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_post_likes_user ON status_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_pokes_to ON pokes(to_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resonance_user ON resonance_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON community_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_posts_group ON community_group_posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_date_plans_conversation ON date_plans(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_action_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_moderation_audit_created ON moderation_audit(created_at DESC);
