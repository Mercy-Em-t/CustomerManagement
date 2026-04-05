class MemoryEngine {
  constructor(maxHistory = 20) {
    this.sessions = new Map();
    this.maxHistory = maxHistory;
  }

  getSession(userId) {
    if (!this.sessions.has(userId)) {
      this.sessions.set(userId, {
        history: [],
        preferences: {},
        currentIntent: null,
      });
    }
    return this.sessions.get(userId);
  }

  addMessage(userId, role, content) {
    const session = this.getSession(userId);
    session.history.push({ role, content, timestamp: Date.now() });
    if (session.history.length > this.maxHistory) {
      session.history = session.history.slice(-this.maxHistory);
    }
  }

  updateIntent(userId, intent) {
    const session = this.getSession(userId);
    session.currentIntent = intent;
  }

  updatePreferences(userId, preferences) {
    const session = this.getSession(userId);
    Object.assign(session.preferences, preferences);
  }

  clearSession(userId) {
    this.sessions.delete(userId);
  }

  getHistory(userId, limit) {
    const session = this.getSession(userId);
    if (limit) {
      return session.history.slice(-limit);
    }
    return session.history;
  }
}

module.exports = MemoryEngine;
