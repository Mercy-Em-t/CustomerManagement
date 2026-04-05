describe('authService (env fallback)', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    process.env.API_KEYS = 'my_shop:secure_key,other_shop:other_key';
  });

  test('resolves business with matching env api key', async () => {
    const { resolveBusinessByAuth } = require('../src/services/authService');

    const business = await resolveBusinessByAuth('secure_key', 'my_shop');

    expect(business).toEqual({
      id: 'my_shop',
      name: 'my_shop',
      brainFile: 'my_shop.json',
      brainId: 'my_shop',
      source: 'env',
    });
  });

  test('returns null for mismatched key', async () => {
    const { resolveBusinessByAuth } = require('../src/services/authService');
    const business = await resolveBusinessByAuth('wrong', 'my_shop');
    expect(business).toBeNull();
  });
});
