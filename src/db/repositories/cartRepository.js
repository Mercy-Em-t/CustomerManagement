const db = require('../client');

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

async function getOrCreateActiveCart(userId, businessId, client = null) {
  const queryClient = client || db;
  const selectResult = await queryClient.query(
    `SELECT id, user_id, business_id, status, total, updated_at
     FROM carts
     WHERE user_id = $1 AND business_id = $2 AND status = 'active'
     LIMIT 1`,
    [userId, businessId]
  );

  if (selectResult.rows[0]) return selectResult.rows[0];

  const insertResult = await queryClient.query(
    `INSERT INTO carts (user_id, business_id, status)
     VALUES ($1, $2, 'active')
     RETURNING id, user_id, business_id, status, total, updated_at`,
    [userId, businessId]
  );

  return insertResult.rows[0] || null;
}

async function getCartItems(cartId, client = null) {
  const queryClient = client || db;
  const { rows } = await queryClient.query(
    `SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.price, p.name
     FROM cart_items ci
     LEFT JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.id`,
    [cartId]
  );
  return rows;
}

async function upsertCartItem(cartId, productId, quantity, price, client = null) {
  const queryClient = client || db;
  await queryClient.query(
    `INSERT INTO cart_items (cart_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (cart_id, product_id)
     DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, price = EXCLUDED.price`,
    [cartId, productId, quantity, price]
  );
}

async function setCartItemQuantity(cartId, productId, quantity, client = null) {
  const queryClient = client || db;
  if (quantity <= 0) {
    await removeCartItem(cartId, productId, queryClient);
    return;
  }
  const result = await queryClient.query(
    `UPDATE cart_items SET quantity = $3
     WHERE cart_id = $1 AND product_id = $2`,
    [cartId, productId, quantity]
  );
  if (!result.rowCount) throw new Error('Item not found in cart');
}

async function removeCartItem(cartId, productId, client = null) {
  const queryClient = client || db;
  await queryClient.query(
    `DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2`,
    [cartId, productId]
  );
}

async function syncCartTotal(cartId, client = null) {
  const queryClient = client || db;
  const items = await getCartItems(cartId, queryClient);
  const total = calculateTotal(items);
  await queryClient.query(
    `UPDATE carts SET total = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [cartId, total]
  );
  return total;
}

async function checkoutCart(cartId, userId, businessId, client = null) {
  const queryClient = client || db;
  const items = await getCartItems(cartId, queryClient);
  if (!items.length) throw new Error('Cart is empty');

  const total = calculateTotal(items);
  await queryClient.query(
    `UPDATE carts SET status = 'confirmed', total = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
    [cartId, total]
  );

  const { rows } = await queryClient.query(
    `INSERT INTO orders (cart_id, user_id, business_id, status, total)
     VALUES ($1, $2, $3, 'confirmed', $4)
     RETURNING id, status, total, created_at`,
    [cartId, userId, businessId, total]
  );

  return {
    order: rows[0],
    items,
    total,
  };
}

module.exports = {
  getOrCreateActiveCart,
  getCartItems,
  upsertCartItem,
  setCartItemQuantity,
  removeCartItem,
  syncCartTotal,
  checkoutCart,
};
