const NodeCache = require('node-cache');
const config = require('../config');
const webhookDedupeStore = require('../services/webhookDedupeStore');

const cache = new NodeCache({
  stdTTL: config.webhookDedupeTtlSeconds,
  checkperiod: Math.max(1, Math.floor(config.webhookDedupeTtlSeconds / 2)),
  useClones: false,
});

function collectMessageIds(body) {
  const ids = [];
  const entries = Array.isArray(body && body.entry) ? body.entry : [];
  entries.forEach(entry => {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    changes.forEach(change => {
      const messages = (((change || {}).value || {}).messages);
      if (Array.isArray(messages)) {
        messages.forEach(msg => {
          if (msg && typeof msg.id === 'string' && msg.id) {
            ids.push(msg.id);
          }
        });
      }
    });
  });
  return ids;
}

module.exports = async function webhookIdempotency(req, res, next) {
  const ids = collectMessageIds(req.body);
  if (!ids.length) return next();

  const memoryDuplicate = ids.some(id => cache.has(id));
  const dbDuplicate = await webhookDedupeStore.isDuplicate(ids).catch(() => false);
  const duplicate = memoryDuplicate || dbDuplicate;
  if (duplicate) {
    return res.status(200).json({ success: true, duplicate: true });
  }

  ids.forEach(id => cache.set(id, true));
  await webhookDedupeStore.markProcessed(ids).catch((err) => {
    console.error('Webhook dedupe persistence error:', err.message);
  });
  next();
};
