class Orchestrator {
  constructor(brainLoader, aiEngine, orderEngine, memoryEngine, intentDetector) {
    this.brainLoader = brainLoader;
    this.aiEngine = aiEngine;
    this.orderEngine = orderEngine;
    this.memoryEngine = memoryEngine;
    this.intentDetector = intentDetector;
  }

  async handleMessage(businessId, userId, message) {
    // 1. Load brain
    const brain = await this.brainLoader.loadBrain(businessId);

    // 2. Get conversation history
    const config = require('./config');
    const history = this.memoryEngine.getHistory(userId, config.maxConversationHistory);

    // 3. Send to AI engine
    const aiOutput = await this.aiEngine.processMessage(brain, message, history);

    // 4. Detect intent
    const intent = this.intentDetector.detect(aiOutput);
    const entities = this.intentDetector.extractEntities(aiOutput);

    // 5. Update memory with user message and AI response
    this.memoryEngine.addMessage(userId, 'user', message);
    this.memoryEngine.addMessage(userId, 'assistant', aiOutput.response);
    this.memoryEngine.updateIntent(userId, intent);

    if (entities && Object.keys(entities).length > 0) {
      this.memoryEngine.updatePreferences(userId, entities);
    }

    // 6. Handle purchase intent - add to cart if product entity present
    let cart = null;
    if (intent === 'purchase' && entities.product_id) {
      this.orderEngine.addItem(userId, {
        product_id: entities.product_id,
        name: entities.product_name || 'Product',
        quantity: entities.quantity || 1,
        price: entities.price || 0,
      });
      cart = this.orderEngine.viewCart(userId);
    }

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
