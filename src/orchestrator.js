const config = require('./config');
const analyticsRepository = require('./db/repositories/analyticsRepository');
const { recommendProducts } = require('./modules/recommendation/recommendation.service');

class Orchestrator {
  constructor(brainLoader, aiEngine, orderEngine, memoryStore, intentDetector, productService) {
    this.brainLoader = brainLoader;
    this.aiEngine = aiEngine;
    this.orderEngine = orderEngine;
    this.memoryStore = memoryStore;
    this.intentDetector = intentDetector;
    this.productService = productService;
  }

  async handleMessage(businessId, userId, message) {
    // 1. Load brain
    const brain = await this.brainLoader.loadBrain(businessId);

    // 2. Get/create conversation context + history
    const context = await this.memoryStore.getOrCreateContext(businessId, userId);
    const history = await this.memoryStore.getHistory(context, userId, config.maxConversationHistory);
    const products = this.productService ? await this.productService.listProducts(businessId) : [];
    const existingCart = await this.orderEngine.viewCart(businessId, userId);

    // 3. Build recommendations and send to AI engine
    const initialRecommendations = recommendProducts({
      products,
      cart: existingCart || { items: [], total: 0 },
      intent: 'product_search',
    });
    const aiOutput = await this.aiEngine.processMessage(
      brain,
      message,
      history,
      products,
      initialRecommendations
    );

    // 4. Detect intent
    const intent = this.intentDetector.detect(aiOutput);
    const entities = this.intentDetector.extractEntities(aiOutput);

    // 5. Update memory with user message and AI response
    await this.memoryStore.addMessage(context, userId, 'user', message);
    await this.memoryStore.addMessage(context, userId, 'assistant', aiOutput.response);
    await this.memoryStore.updateState(context, userId, intent, entities);

    // 6. Handle purchase intent - add to cart if product entity present
    let cart = null;
    if (intent === 'purchase') {
      let productPayload = null;
      if (entities.product_id) {
        productPayload = {
          product_id: entities.product_id,
          name: entities.product_name || 'Product',
          quantity: entities.quantity || 1,
          price: entities.price || 0,
        };
      } else if (this.productService && entities.product) {
        const matchedProduct = await this.productService.findByNameLike(businessId, entities.product);
        if (matchedProduct) {
          productPayload = {
            product_id: matchedProduct.id,
            name: matchedProduct.name,
            quantity: entities.quantity || 1,
            price: Number(matchedProduct.price) || 0,
          };
        }
      }

      if (productPayload) {
        cart = await this.orderEngine.addItem(businessId, userId, productPayload);
      }
    }

    const recommendations = recommendProducts({
      products,
      cart: cart || existingCart || { items: [], total: 0 },
      intent,
    });

    await analyticsRepository.trackIntent(businessId, intent, true);

    // 7. Return result
    return {
      response: aiOutput.response,
      intent,
      confidence: aiOutput.confidence || 1.0,
      entities,
      cart,
      recommendations,
    };
  }
}

module.exports = Orchestrator;
