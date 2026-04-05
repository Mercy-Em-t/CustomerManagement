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

module.exports = {
  getByIdAndBusiness,
};
