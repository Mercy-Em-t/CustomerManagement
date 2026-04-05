function parseApiKeys(raw) {
  const map = {};
  if (!raw) return map;
  raw.split(',').forEach(pair => {
    const [businessId, key] = pair.trim().split(':');
    if (businessId && key) map[businessId] = key;
  });
  return map;
}

function parseColonMap(raw) {
  const map = {};
  if (!raw) return map;
  raw.split(',').forEach(pair => {
    const [left, right] = pair.trim().split(':');
    if (left && right) map[left] = right;
  });
  return map;
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  databaseUrl: process.env.DATABASE_URL || '',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  databasePoolMax: parseInt(process.env.DB_POOL_MAX, 10) || 10,
  databasePoolIdleTimeoutMs: parseInt(process.env.DB_POOL_IDLE_TIMEOUT_MS, 10) || 30000,
  databasePoolConnectionTimeoutMs: parseInt(process.env.DB_POOL_CONNECTION_TIMEOUT_MS, 10) || 5000,
  apiKeys: parseApiKeys(process.env.API_KEYS || ''),
  brainCacheTTL: parseInt(process.env.BRAIN_CACHE_TTL, 10) || 300,
  maxConversationHistory: parseInt(process.env.MAX_CONVERSATION_HISTORY, 10) || 20,
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  whatsappAppSecret: process.env.WHATSAPP_APP_SECRET || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappPhoneBusinessMap: parseColonMap(process.env.WHATSAPP_PHONE_BUSINESS_MAP || ''),
  whatsappDefaultBusinessId: process.env.WHATSAPP_DEFAULT_BUSINESS_ID || '',
  webhookDedupeTtlSeconds: parseInt(process.env.WEBHOOK_DEDUPE_TTL_SECONDS, 10) || 300,
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION || 'v20.0',
  productSyncIntervalSeconds: parseInt(process.env.PRODUCT_SYNC_INTERVAL_SECONDS, 10) || 300,
  productSyncTimeoutMs: parseInt(process.env.PRODUCT_SYNC_TIMEOUT_MS, 10) || 10000,
  productSyncRetryCount: parseInt(process.env.PRODUCT_SYNC_RETRY_COUNT, 10) || 2,
  productSyncRetryBaseMs: parseInt(process.env.PRODUCT_SYNC_RETRY_BASE_MS, 10) || 500,
};
