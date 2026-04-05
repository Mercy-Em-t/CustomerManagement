const db = require('../db/client');

async function isDuplicate(ids) {
  if (!db.isDbEnabled() || !ids.length) return false;

  const { rows } = await db.query(
    `SELECT id FROM processed_webhook_messages WHERE id = ANY($1::text[])`,
    [ids]
  );
  return rows.length > 0;
}

async function markProcessed(ids) {
  if (!db.isDbEnabled() || !ids.length) return;

  const values = ids.map((_, idx) => `($${idx + 1})`).join(', ');
  await db.query(
    `INSERT INTO processed_webhook_messages (id)
     VALUES ${values}
     ON CONFLICT (id) DO NOTHING`,
    ids
  );
}

module.exports = {
  isDuplicate,
  markProcessed,
};
