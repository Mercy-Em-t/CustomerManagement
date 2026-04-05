class OrderEngine {
  constructor() {
    this.carts = new Map();
  }

  getCart(userId) {
    if (!this.carts.has(userId)) {
      this.carts.set(userId, { items: [], status: 'active' });
    }
    return this.carts.get(userId);
  }

  addItem(userId, product) {
    const cart = this.getCart(userId);
    const existing = cart.items.find(i => i.product_id === product.product_id);
    if (existing) {
      existing.quantity += product.quantity || 1;
    } else {
      cart.items.push({
        product_id: product.product_id,
        name: product.name,
        quantity: product.quantity || 1,
        price: product.price,
      });
    }
    return cart;
  }

  removeItem(userId, productId) {
    const cart = this.getCart(userId);
    cart.items = cart.items.filter(i => i.product_id !== productId);
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
    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }
    const payload = {
      orderId: `ORD-${Date.now()}-${userId}`,
      items: [...cart.items],
      total: this._calculateTotal(cart.items),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    cart.items = [];
    cart.status = 'confirmed';
    return payload;
  }

  _calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

module.exports = OrderEngine;
