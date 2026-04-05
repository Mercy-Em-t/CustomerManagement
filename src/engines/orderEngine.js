const {
  getOrCreateCart,
  addItem: addModuleItem,
  removeItem: removeModuleItem,
  checkout: checkoutModuleCart,
  recalculate,
} = require('../modules/orders/order.service');

class OrderEngine {
  constructor() {
    this.carts = [];
  }

  getCart(userId) {
    return getOrCreateCart({ id: userId }, this.carts);
  }

  addItem(userId, product) {
    const cart = this.getCart(userId);
    addModuleItem(cart, product, product.quantity || 1);
    return cart;
  }

  removeItem(userId, productId) {
    const cart = this.getCart(userId);
    removeModuleItem(cart, productId);
    return cart;
  }

  updateQuantity(userId, productId, quantity) {
    const cart = this.getCart(userId);
    const item = cart.items.find(i => i.product_id === productId);
    if (!item) throw new Error('Item not found in cart');
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }
    item.quantity = quantity;
    recalculate(cart);
    return cart;
  }

  viewCart(userId) {
    const cart = this.getCart(userId);
    return {
      items: cart.items,
      total: this._calculateTotal(cart.items),
      status: cart.status,
      itemCount: cart.items.reduce((sum, i) => sum + i.quantity, 0),
    };
  }

  checkout(userId) {
    const cart = this.getCart(userId);
    const order = checkoutModuleCart(cart);
    const payload = {
      orderId: `ORD-${order.order_id}`,
      items: [...cart.items],
      total: order.total,
      status: order.status,
      createdAt: new Date().toISOString(),
    };
    cart.items = [];
    cart.status = 'active';
    cart.total = 0;
    return payload;
  }

  _calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

module.exports = OrderEngine;
