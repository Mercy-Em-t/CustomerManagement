const db = require('../client');

async function getOrCreateByIdentifier(businessId, identifier) {
  const { rows } = await db.query(
    `INSERT INTO users (business_id, identifier)
     VALUES ($1, $2)
     ON CONFLICT (business_id, identifier)
     DO UPDATE SET identifier = EXCLUDED.identifier
     RETURNING id, business_id, identifier, created_at`,
    [businessId, identifier]
  );
  return rows[0] || null;
}

module.exports = {
  getOrCreateByIdentifier,
};
