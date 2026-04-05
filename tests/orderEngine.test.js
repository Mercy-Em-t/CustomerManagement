const OrderEngine = require('../src/engines/orderEngine');

describe('OrderEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new OrderEngine();
  });

  const sampleProduct = {
    product_id: 'prod_001',
    name: 'Wireless Headphones',
    quantity: 1,
    price: 99.99,
  };

  test('addItem creates a new cart for user', () => {
    const cart = engine.addItem('user1', sampleProduct);
    expect(cart).toBeDefined();
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].product_id).toBe('prod_001');
  });

  test('addItem with existing item increases quantity', () => {
    engine.addItem('user1', sampleProduct);
    engine.addItem('user1', { ...sampleProduct, quantity: 2 });
    const cart = engine.viewCart('user1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
  });

  test('removeItem removes product from cart', () => {
    engine.addItem('user1', sampleProduct);
    engine.addItem('user1', { product_id: 'prod_002', name: 'USB Cable', quantity: 1, price: 9.99 });
    engine.removeItem('user1', 'prod_001');
    const cart = engine.viewCart('user1');
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].product_id).toBe('prod_002');
  });

  test('updateQuantity changes item quantity', () => {
    engine.addItem('user1', sampleProduct);
    engine.updateQuantity('user1', 'prod_001', 5);
    const cart = engine.viewCart('user1');
    expect(cart.items[0].quantity).toBe(5);
  });

  test('updateQuantity with 0 removes the item', () => {
    engine.addItem('user1', sampleProduct);
    engine.updateQuantity('user1', 'prod_001', 0);
    const cart = engine.viewCart('user1');
    expect(cart.items).toHaveLength(0);
  });

  test('viewCart returns correct total', () => {
    engine.addItem('user1', sampleProduct); // 99.99 x 1
    engine.addItem('user1', { product_id: 'prod_002', name: 'USB Cable', quantity: 2, price: 9.99 });
    const cart = engine.viewCart('user1');
    expect(cart.total).toBeCloseTo(119.97, 2);
    expect(cart.itemCount).toBe(3);
  });

  test('checkout returns order payload and clears cart', () => {
    engine.addItem('user1', sampleProduct);
    const order = engine.checkout('user1');
    expect(order.orderId).toMatch(/^ORD-/);
    expect(order.status).toBe('confirmed');
    expect(order.items).toHaveLength(1);
    expect(order.total).toBeCloseTo(99.99, 2);
    // Cart should be empty after checkout
    const cart = engine.viewCart('user1');
    expect(cart.items).toHaveLength(0);
  });

  test('checkout throws error on empty cart', () => {
    expect(() => engine.checkout('user_empty')).toThrow('Cart is empty');
  });

  test('updateQuantity throws error when item not in cart', () => {
    expect(() => engine.updateQuantity('user1', 'nonexistent_prod', 3)).toThrow('Item not found in cart');
  });
});
