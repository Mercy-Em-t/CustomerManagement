const NodeCache = require('node-cache');
const config = require('../config');

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

module.exports = function webhookIdempotency(req, res, next) {
  const ids = collectMessageIds(req.body);
  if (!ids.length) return next();

  const duplicate = ids.some(id => cache.has(id));
  if (duplicate) {
    return res.status(200).json({ success: true, duplicate: true });
  }

  ids.forEach(id => cache.set(id, true));
  next();
};
