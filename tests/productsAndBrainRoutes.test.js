const express = require('express');
const request = require('supertest');

function buildApp() {
  const auth = require('../src/middleware/auth');
  const rateLimiter = require('../src/middleware/rateLimiter');
  const productsRouter = require('../src/routes/products');
  const brainRouter = require('../src/routes/brain');
  const analyticsRouter = require('../src/routes/analytics');
  const syncRouter = require('../src/routes/sync');
  const ProductService = require('../src/services/productService');
  const BrainAdminService = require('../src/services/brainAdminService');
  const AnalyticsService = require('../src/services/analyticsService');
  const ProductSyncService = require('../src/services/productSyncService');
  const BrainLoader = require('../src/engines/brainLoader');

  const app = express();
  app.use(express.json());
  app.use(rateLimiter);

  app.use('/api/products', auth, productsRouter(new ProductService()));
  app.use('/api/brain', auth, brainRouter(new BrainAdminService(new BrainLoader(60))));
  app.use('/api/analytics', auth, analyticsRouter(new AnalyticsService()));
  app.use('/api/sync', auth, syncRouter(new ProductSyncService()));

  return app;
}

describe('products + brain routes (DB disabled)', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.DATABASE_URL;
    process.env.API_KEYS = 'my_shop:secure_key';
  });

  test('GET /api/products returns empty array with fallback mode', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/products')
      .set('x-api-key', 'secure_key')
      .set('x-business-id', 'my_shop');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.products)).toBe(true);
    expect(res.body.products).toHaveLength(0);
  });

  test('GET /api/brain returns fallback brain metadata', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/brain')
      .set('x-api-key', 'secure_key')
      .set('x-business-id', 'my_shop');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.brain).toEqual({
      business_id: 'my_shop',
      brain_file: 'my_shop.json',
    });
  });

  test('POST /api/brain rejects invalid config payload', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/brain')
      .set('x-api-key', 'secure_key')
      .set('x-business-id', 'my_shop')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('missing required field');
  });

  test('GET /api/analytics/summary returns fallback summary when DB disabled', async () => {
    const app = buildApp();
    const res = await request(app)
      .get('/api/analytics/summary')
      .set('x-api-key', 'secure_key')
      .set('x-business-id', 'my_shop');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toEqual({
      topIntents: [],
      conversionRate: 0,
    });
  });

  test('POST /api/sync/products returns skipped when DB disabled', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/sync/products')
      .set('x-api-key', 'secure_key')
      .set('x-business-id', 'my_shop');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.result.skipped).toBe(true);
  });
});
