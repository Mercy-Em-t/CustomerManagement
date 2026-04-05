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

async function upsertByExternalId(businessId, product) {
  const { rows } = await db.query(
    `SELECT id
     FROM products
     WHERE business_id = $1 AND external_id = $2
     LIMIT 1`,
    [businessId, product.external_id]
  );

  if (rows[0]) {
    await db.query(
      `UPDATE products
       SET name = $1, description = $2, price = $3, category = $4, tags = $5, stock = $6
       WHERE id = $7`,
      [
        product.name,
        product.description,
        product.price,
        product.category,
        product.tags,
        product.stock,
        rows[0].id,
      ]
    );
    return { id: rows[0].id, updated: true };
  }

  const inserted = await db.query(
    `INSERT INTO products (business_id, name, description, price, category, tags, stock, external_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      businessId,
      product.name,
      product.description,
      product.price,
      product.category,
      product.tags,
      product.stock,
      product.external_id,
    ]
  );

  return { id: inserted.rows[0].id, updated: false };
}

module.exports = {
  listByBusiness,
  getById,
  upsertByExternalId,
};
