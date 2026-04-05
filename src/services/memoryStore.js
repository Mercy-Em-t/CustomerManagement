const db = require('../db/client');
const userRepository = require('../db/repositories/userRepository');
const conversationRepository = require('../db/repositories/conversationRepository');
const messageRepository = require('../db/repositories/messageRepository');

class MemoryStore {
  constructor(inMemoryEngine, maxHistory) {
    this.inMemoryEngine = inMemoryEngine;
    this.maxHistory = maxHistory || 20;
  }

  async getOrCreateContext(businessId, userIdentifier) {
    if (!db.isDbEnabled()) {
      return {
        mode: 'memory',
        userId: userIdentifier,
        conversationId: userIdentifier,
      };
    }

    const user = await userRepository.getOrCreateByIdentifier(businessId, userIdentifier);
    const conversation = await conversationRepository.getOrCreateActive(user.id, businessId);

    return {
      mode: 'db',
      userId: user.id,
      conversationId: conversation.id,
      state: conversation.state || {},
      lastIntent: conversation.last_intent || null,
      userIdentifier,
      businessId,
    };
  }

  async getHistory(context, userIdentifier, limit) {
    const historyLimit = Number.isFinite(Number(limit)) ? Number(limit) : this.maxHistory;
    if (!db.isDbEnabled() || context.mode === 'memory') {
      return this.inMemoryEngine.getHistory(userIdentifier, historyLimit);
    }

    const rows = await messageRepository.getRecent(context.conversationId, historyLimit);
    return rows.map(row => ({
      role: row.sender === 'assistant' || row.sender === 'ai' ? 'assistant' : 'user',
      content: row.message,
      timestamp: new Date(row.created_at).getTime(),
    }));
  }

  async addMessage(context, userIdentifier, role, content, metadata = {}) {
    if (!db.isDbEnabled() || context.mode === 'memory') {
      this.inMemoryEngine.addMessage(userIdentifier, role, content);
      return;
    }

    await messageRepository.saveMessage(
      context.conversationId,
      role === 'assistant' ? 'assistant' : 'user',
      content,
      metadata
    );
  }

  async updateState(context, userIdentifier, intent, entities) {
    if (!db.isDbEnabled() || context.mode === 'memory') {
      this.inMemoryEngine.updateIntent(userIdentifier, intent);
      if (entities && Object.keys(entities).length > 0) {
        this.inMemoryEngine.updatePreferences(userIdentifier, entities);
      }
      return;
    }

    const state = {
      entities: entities || {},
      updatedAt: new Date().toISOString(),
    };
    await conversationRepository.updateState(context.conversationId, intent, state);
  }
}

module.exports = MemoryStore;
