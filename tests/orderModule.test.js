const {
  getOrCreateCart,
  addItem,
  removeItem,
  checkout,
  recalculate,
} = require('../src/modules/orders/order.service');

describe('order module service', () => {
  test('getOrCreateCart creates active cart', () => {
    const carts = [];
    const user = { id: 'u1' };
    const cart = getOrCreateCart(user, carts);

    expect(cart.user_id).toBe('u1');
    expect(cart.status).toBe('active');
    expect(carts).toHaveLength(1);
  });

  test('addItem merges existing product and recalculates total', () => {
    const cart = { items: [], total: 0, status: 'active' };
    addItem(cart, { id: 'p1', name: 'Tea', price: 100 }, 1);
    addItem(cart, { id: 'p1', name: 'Tea', price: 100 }, 2);

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.total).toBe(300);
  });

  test('removeItem updates total', () => {
    const cart = {
      items: [
        { product_id: 'p1', name: 'Tea', quantity: 2, price: 100 },
        { product_id: 'p2', name: 'Coffee', quantity: 1, price: 200 },
      ],
      total: 0,
      status: 'active',
    };

    recalculate(cart);
    expect(cart.total).toBe(400);

    removeItem(cart, 'p2');
    expect(cart.items).toHaveLength(1);
    expect(cart.total).toBe(200);
  });

  test('checkout returns order and confirms cart', () => {
    const cart = {
      items: [{ product_id: 'p1', name: 'Tea', quantity: 1, price: 100 }],
      total: 100,
      status: 'active',
    };

    const order = checkout(cart);
    expect(order.order_id).toBeDefined();
    expect(order.total).toBe(100);
    expect(order.status).toBe('confirmed');
    expect(cart.status).toBe('confirmed');
  });

  test('checkout throws on empty cart', () => {
    const cart = { items: [], total: 0, status: 'active' };
    expect(() => checkout(cart)).toThrow('Cart is empty');
  });
});
