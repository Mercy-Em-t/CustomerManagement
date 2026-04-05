require('dotenv').config();

const express = require('express');
const config = require('./config');
const rateLimiter = require('./middleware/rateLimiter');
const auth = require('./middleware/auth');

const BrainLoader = require('./engines/brainLoader');
const AIEngine = require('./engines/aiEngine');
const OrderEngine = require('./engines/orderEngine');
const MemoryEngine = require('./engines/memoryEngine');
const IntentDetector = require('./engines/intentDetector');
const Orchestrator = require('./orchestrator');
const MemoryStore = require('./services/memoryStore');
const OrderService = require('./services/orderService');
const ProductService = require('./services/productService');
const BrainAdminService = require('./services/brainAdminService');
const AnalyticsService = require('./services/analyticsService');
const ProductSyncService = require('./services/productSyncService');

const chatRouter = require('./routes/chat');
const ordersRouter = require('./routes/orders');
const productsRouter = require('./routes/products');
const brainRouter = require('./routes/brain');
const analyticsRouter = require('./routes/analytics');
const syncRouter = require('./routes/sync');
const healthRouter = require('./routes/health');
const webhooksRouter = require('./routes/webhooks');

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(rateLimiter);

// Instantiate engines
const brainLoader = new BrainLoader(config.brainCacheTTL);
const aiEngine = new AIEngine();
const fallbackOrderEngine = new OrderEngine();
const memoryEngine = new MemoryEngine(config.maxConversationHistory);
const memoryStore = new MemoryStore(memoryEngine, config.maxConversationHistory);
const orderService = new OrderService(fallbackOrderEngine);
const productService = new ProductService();
const brainAdminService = new BrainAdminService(brainLoader);
const analyticsService = new AnalyticsService();
const productSyncService = new ProductSyncService();
const intentDetector = new IntentDetector();
const orchestrator = new Orchestrator(
  brainLoader,
  aiEngine,
  orderService,
  memoryStore,
  intentDetector,
  productService
);

// Routes
app.use('/health', healthRouter);
app.use('/api/chat', auth, chatRouter(orchestrator));
app.use('/api/orders', auth, ordersRouter(orderService));
app.use('/api/products', auth, productsRouter(productService));
app.use('/api/brain', auth, brainRouter(brainAdminService));
app.use('/api/analytics', auth, analyticsRouter(analyticsService));
app.use('/api/sync', auth, syncRouter(productSyncService));
app.use('/webhooks', webhooksRouter(orchestrator));

if (config.productSyncIntervalSeconds > 0) {
  const intervalMs = config.productSyncIntervalSeconds * 1000;
  setInterval(async () => {
    try {
      const result = await productSyncService.syncScheduledBusinesses();
      if (!result.skipped) {
        console.log(`Scheduled sync complete: triggered=${result.triggered}`);
      }
    } catch (err) {
      console.error('Scheduled sync loop failed:', err.message);
    }
  }, intervalMs);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.port, () => {
  console.log(`SalesBrain engine running on port ${config.port} [${config.nodeEnv}]`);
});

module.exports = { app, server };
