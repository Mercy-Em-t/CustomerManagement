const db = require('../client');

async function saveMessage(conversationId, sender, message, metadata = {}) {
  const { rows } = await db.query(
    `INSERT INTO messages (conversation_id, sender, message, metadata)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, conversation_id, sender, message, metadata, created_at`,
    [conversationId, sender, message, JSON.stringify(metadata)]
  );
  return rows[0] || null;
}

async function getRecent(conversationId, limit = 20) {
  const normalizedLimit = Math.max(1, Math.min(200, parseInt(limit, 10) || 20));
  const { rows } = await db.query(
    `SELECT id, conversation_id, sender, message, metadata, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, normalizedLimit]
  );
  return rows.reverse();
}

module.exports = {
  saveMessage,
  getRecent,
};
