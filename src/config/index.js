function parseApiKeys(raw) {
  const map = {};
  if (!raw) return map;
  raw.split(',').forEach(pair => {
    const [businessId, key] = pair.trim().split(':');
    if (businessId && key) map[businessId] = key;
  });
  return map;
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  apiKeys: parseApiKeys(process.env.API_KEYS || ''),
  brainCacheTTL: parseInt(process.env.BRAIN_CACHE_TTL, 10) || 300,
  maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY, 10) || 20,
};
