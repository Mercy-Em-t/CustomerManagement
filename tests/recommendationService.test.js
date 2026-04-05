const { recommendProducts } = require('../src/modules/recommendation/recommendation.service');

describe('recommendation.service', () => {
  const products = [
    { id: 'p1', name: 'Tea', category: 'drink', price: 100 },
    { id: 'p2', name: 'Coffee', category: 'drink', price: 200 },
    { id: 'p3', name: 'Mug', category: 'accessory', price: 300 },
    { id: 'p4', name: 'Kettle', category: 'appliance', price: 500 },
  ];

  test('returns first products for product_search', () => {
    const output = recommendProducts({ products, cart: { items: [], total: 0 }, intent: 'product_search' });
    expect(output).toHaveLength(3);
    expect(output[0].id).toBe('p1');
  });

  test('returns cross-sell by matching cart categories', () => {
    const output = recommendProducts({
      products,
      cart: { items: [{ product_id: 'p1', category: 'drink' }], total: 100 },
      intent: 'other',
    });
    expect(output.find((p) => p.id === 'p2')).toBeDefined();
    expect(output.find((p) => p.id === 'p1')).toBeUndefined();
  });

  test('returns upsell suggestions for purchase intent', () => {
    const output = recommendProducts({
      products,
      cart: { items: [{ product_id: 'p1', category: 'drink' }], total: 150 },
      intent: 'purchase',
    });
    expect(output.every((p) => p.price > 150)).toBe(true);
    expect(output.length).toBeLessThanOrEqual(2);
  });
});
