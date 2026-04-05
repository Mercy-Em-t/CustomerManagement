const crypto = require('crypto');

function recalculate(cart) {
  cart.total = cart.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
}

function getOrCreateCart(user, carts) {
  let cart = carts.find((c) => c.user_id === user.id && c.status === 'active');

  if (!cart) {
    cart = {
      id: crypto.randomUUID(),
      user_id: user.id,
      items: [],
      total: 0,
      status: 'active',
    };
    carts.push(cart);
  }

  return cart;
}

function addItem(cart, product, quantity) {
  const existing = cart.items.find((i) => i.product_id === product.id || i.product_id === product.product_id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      product_id: product.id || product.product_id,
      name: product.name,
      quantity,
      price: Number(product.price),
    });
  }

  recalculate(cart);
  return cart;
}

function removeItem(cart, productId) {
  cart.items = cart.items.filter((i) => i.product_id !== productId);
  recalculate(cart);
  return cart;
}

function checkout(cart) {
  if (cart.items.length === 0) {
    throw new Error('Cart is empty');
  }

  cart.status = 'confirmed';

  return {
    order_id: crypto.randomUUID(),
    total: cart.total,
    status: 'confirmed',
  };
}

module.exports = {
  getOrCreateCart,
  addItem,
  removeItem,
  checkout,
  recalculate,
};
