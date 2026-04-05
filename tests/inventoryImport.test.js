const {
  parseMessyProductList,
  normalizeCategory,
  parseTags,
} = require('../src/modules/sync/inventoryImport');

describe('inventoryImport module', () => {
  test('parseMessyProductList converts quick text list into system-ready objects', () => {
    const rows = parseMessyProductList('chia seeds 300, pumpkin seeds 250, oats 150');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      id: 'manual_1',
      name: 'chia seeds',
      price: 300,
      category: 'seeds',
    });
    expect(rows[2]).toMatchObject({
      name: 'oats',
      price: 150,
      category: 'cereals',
    });
  });

  test('normalizeCategory creates safe normalized category keys', () => {
    expect(normalizeCategory('Herbal Teas & Blends')).toBe('herbal_teas_and_blends');
  });

  test('parseTags supports both | and comma separators', () => {
    expect(parseTags('weight-loss|fiber,omega-3')).toEqual(['weight-loss', 'fiber', 'omega-3']);
  });
});
