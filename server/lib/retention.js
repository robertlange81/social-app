const db = require('../db')

function runRetentionCleanup () {
  db.transaction(() => {
    db.prepare("DELETE FROM auth_action_tokens WHERE datetime(expires_at) < datetime('now','-7 days') OR (used_at IS NOT NULL AND datetime(used_at) < datetime('now','-7 days'))").run()
    db.prepare("DELETE FROM notifications WHERE read_at IS NOT NULL AND datetime(read_at) < datetime('now','-90 days')").run()
    db.prepare("DELETE FROM profile_views WHERE datetime(created_at) < datetime('now','-180 days')").run()
  })()
}

module.exports = { runRetentionCleanup }
