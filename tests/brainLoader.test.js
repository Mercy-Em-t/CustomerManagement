const BrainLoader = require('../src/engines/brainLoader');

describe('BrainLoader', () => {
  let loader;

  beforeEach(() => {
    loader = new BrainLoader(60);
  });

  afterEach(() => {
    loader.clearCache();
  });

  test('loads a valid brain config', async () => {
    const brain = await loader.loadBrain('demo_store');
    expect(brain).toBeDefined();
    expect(brain.identity).toBeDefined();
    expect(brain.identity.role).toBe('Sales Assistant for DemoMart');
    expect(brain.business_context).toBeDefined();
  });

  test('caches brain on second load (returns same object)', async () => {
    const first = await loader.loadBrain('demo_store');
    const second = await loader.loadBrain('demo_store');
    expect(first).toBe(second); // Same reference from cache
  });

  test('validates brain schema - passes for valid brain', async () => {
    const brain = await loader.loadBrain('demo_store');
    await expect(loader.validateBrain(brain)).resolves.toBe(true);
  });

  test('validates brain schema - throws for missing field', async () => {
    const invalidBrain = {
      identity: {},
      business_context: {},
      // missing knowledge_scope, intent_map, etc.
    };
    await expect(loader.validateBrain(invalidBrain)).rejects.toThrow('missing required field');
  });

  test('throws error when brain file not found', async () => {
    await expect(loader.loadBrain('nonexistent_business')).rejects.toThrow('Brain config not found');
  });

  test('clearCache removes specific brain', async () => {
    await loader.loadBrain('demo_store');
    loader.clearCache('demo_store');
    // After clearing, it should reload from file (no error)
    const brain = await loader.loadBrain('demo_store');
    expect(brain).toBeDefined();
  });
});
