const db = require('../client');

async function listByBusiness(businessId) {
  const { rows } = await db.query(
    `SELECT id, business_id, name, description, price, category, tags, stock, created_at
     FROM products
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );
  return rows;
}

async function getById(businessId, productId) {
  const { rows } = await db.query(
    `SELECT id, business_id, name, description, price, category, tags, stock, created_at
     FROM products
     WHERE business_id = $1 AND id = $2
     LIMIT 1`,
    [businessId, productId]
  );
  return rows[0] || null;
}

module.exports = {
  listByBusiness,
  getById,
};
