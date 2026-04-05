const db = require('../client');

async function getOrCreateActive(userId, businessId) {
  const { rows: existingRows } = await db.query(
    `SELECT id, user_id, business_id, last_intent, state, updated_at
     FROM conversations
     WHERE user_id = $1 AND business_id = $2
     ORDER BY updated_at DESC
     LIMIT 1`,
    [userId, businessId]
  );

  if (existingRows[0]) return existingRows[0];

  const { rows } = await db.query(
    `INSERT INTO conversations (user_id, business_id)
     VALUES ($1, $2)
     RETURNING id, user_id, business_id, last_intent, state, updated_at`,
    [userId, businessId]
  );

  return rows[0] || null;
}

async function updateState(conversationId, lastIntent, state) {
  const { rows } = await db.query(
    `UPDATE conversations
     SET last_intent = $2,
         state = $3::jsonb,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, user_id, business_id, last_intent, state, updated_at`,
    [conversationId, lastIntent, JSON.stringify(state || {})]
  );
  return rows[0] || null;
}

module.exports = {
  getOrCreateActive,
  updateState,
};
