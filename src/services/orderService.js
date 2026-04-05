const db = require('../db/client');
const userRepository = require('../db/repositories/userRepository');
const cartRepository = require('../db/repositories/cartRepository');
const productRepository = require('../db/repositories/productRepository');

class OrderService {
  constructor(fallbackOrderEngine) {
    this.fallbackOrderEngine = fallbackOrderEngine;
  }

  async viewCart(businessId, userIdentifier) {
    if (!db.isDbEnabled()) {
      return this.fallbackOrderEngine.viewCart(userIdentifier);
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);
    const cart = await cartRepository.getOrCreateActiveCart(user.id, businessId);
    const items = await cartRepository.getCartItems(cart.id);
    const total = await cartRepository.syncCartTotal(cart.id);

    return {
      items: items.map(i => ({
        product_id: i.product_id,
        name: i.name || 'Product',
        quantity: i.quantity,
        price: Number(i.price),
      })),
      total: Number(total),
      status: cart.status,
      itemCount: items.reduce((sum, i) => sum + Number(i.quantity), 0),
    };
  }

  async addItem(businessId, userIdentifier, product) {
    if (!db.isDbEnabled()) {
      return this.fallbackOrderEngine.addItem(userIdentifier, product);
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);

    await db.transaction(async client => {
      const cart = await cartRepository.getOrCreateActiveCart(user.id, businessId, client);
      await cartRepository.upsertCartItem(
        cart.id,
        product.product_id,
        product.quantity || 1,
        Number(product.price) || 0,
        client
      );
      await cartRepository.syncCartTotal(cart.id, client);
    });

    return this.viewCart(businessId, userIdentifier);
  }

  async removeItem(businessId, userIdentifier, productId) {
    if (!db.isDbEnabled()) {
      return this.fallbackOrderEngine.removeItem(userIdentifier, productId);
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);

    await db.transaction(async client => {
      const cart = await cartRepository.getOrCreateActiveCart(user.id, businessId, client);
      await cartRepository.removeCartItem(cart.id, productId, client);
      await cartRepository.syncCartTotal(cart.id, client);
    });

    return this.viewCart(businessId, userIdentifier);
  }

  async updateQuantity(businessId, userIdentifier, productId, quantity) {
    if (!db.isDbEnabled()) {
      return this.fallbackOrderEngine.updateQuantity(userIdentifier, productId, quantity);
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);

    await db.transaction(async client => {
      const cart = await cartRepository.getOrCreateActiveCart(user.id, businessId, client);
      await cartRepository.setCartItemQuantity(cart.id, productId, quantity, client);
      await cartRepository.syncCartTotal(cart.id, client);
    });

    return this.viewCart(businessId, userIdentifier);
  }

  async checkout(businessId, userIdentifier) {
    if (!db.isDbEnabled()) {
      return this.fallbackOrderEngine.checkout(userIdentifier);
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);

    const result = await db.transaction(async client => {
      const cart = await cartRepository.getOrCreateActiveCart(user.id, businessId, client);
      return cartRepository.checkoutCart(cart.id, user.id, businessId, client);
    });

    return {
      orderId: result.order.id,
      items: result.items.map(i => ({
        product_id: i.product_id,
        name: i.name || 'Product',
        quantity: i.quantity,
        price: Number(i.price),
      })),
      total: Number(result.total),
      status: result.order.status,
      createdAt: result.order.created_at,
    };
  }

  async getProductById(businessId, productId) {
    if (!db.isDbEnabled()) return null;
    return productRepository.getById(businessId, productId);
  }
}

module.exports = OrderService;
