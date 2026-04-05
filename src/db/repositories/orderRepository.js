const db = require('../client');

async function getByIdAndBusiness(orderId, businessId) {
  const { rows } = await db.query(
    `SELECT id, cart_id, user_id, business_id, status, total, created_at
     FROM orders
     WHERE id = $1 AND business_id = $2
     LIMIT 1`,
    [orderId, businessId]
  );
  return rows[0] || null;
}

async function listByBusiness(businessId, limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const { rows } = await db.query(
    `SELECT id, cart_id, user_id, business_id, status, total, created_at
     FROM orders
     WHERE business_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [businessId, safeLimit]
  );
  return rows;
}

module.exports = {
  getByIdAndBusiness,
  listByBusiness,
};
