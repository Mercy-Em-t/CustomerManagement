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

const chatRouter = require('./routes/chat');
const ordersRouter = require('./routes/orders');
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
const orderEngine = new OrderEngine();
const memoryEngine = new MemoryEngine(config.maxConversationHistory);
const intentDetector = new IntentDetector();
const orchestrator = new Orchestrator(brainLoader, aiEngine, orderEngine, memoryEngine, intentDetector);

// Routes
app.use('/health', healthRouter);
app.use('/api/chat', auth, chatRouter(orchestrator));
app.use('/api/orders', auth, ordersRouter(orderEngine));
app.use('/webhooks', webhooksRouter(orchestrator));

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
