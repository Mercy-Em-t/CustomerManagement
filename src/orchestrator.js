const config = require('./config');
const analyticsRepository = require('./db/repositories/analyticsRepository');

class Orchestrator {
  constructor(brainLoader, aiEngine, orderEngine, memoryStore, intentDetector) {
    this.brainLoader = brainLoader;
    this.aiEngine = aiEngine;
    this.orderEngine = orderEngine;
    this.memoryStore = memoryStore;
    this.intentDetector = intentDetector;
  }

  async handleMessage(businessId, userId, message) {
    // 1. Load brain
    const brain = await this.brainLoader.loadBrain(businessId);

    // 2. Get/create conversation context + history
    const context = await this.memoryStore.getOrCreateContext(businessId, userId);
    const history = await this.memoryStore.getHistory(context, userId, config.maxConversationHistory);

    // 3. Send to AI engine
    const aiOutput = await this.aiEngine.processMessage(brain, message, history);

    // 4. Detect intent
    const intent = this.intentDetector.detect(aiOutput);
    const entities = this.intentDetector.extractEntities(aiOutput);

    // 5. Update memory with user message and AI response
    await this.memoryStore.addMessage(context, userId, 'user', message);
    await this.memoryStore.addMessage(context, userId, 'assistant', aiOutput.response);
    await this.memoryStore.updateState(context, userId, intent, entities);

    // 6. Handle purchase intent - add to cart if product entity present
    let cart = null;
    if (intent === 'purchase' && entities.product_id) {
      cart = await this.orderEngine.addItem(businessId, userId, {
        product_id: entities.product_id,
        name: entities.product_name || 'Product',
        quantity: entities.quantity || 1,
        price: entities.price || 0,
      });
    }

    await analyticsRepository.trackIntent(businessId, intent, true);

    // 7. Return result
    return {
      response: aiOutput.response,
      intent,
      confidence: aiOutput.confidence || 1.0,
      entities,
      cart,
    };
  }
}

module.exports = Orchestrator;
