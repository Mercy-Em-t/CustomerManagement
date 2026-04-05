const config = require('../config');

module.exports = function auth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const businessId = req.headers['x-business-id'];

  if (!apiKey || !businessId) {
    return res.status(401).json({ error: 'Missing x-api-key or x-business-id header' });
  }

  const expectedKey = config.apiKeys[businessId];
  if (!expectedKey || expectedKey !== apiKey) {
    return res.status(401).json({ error: 'Invalid API key for this business' });
  }

  req.businessId = businessId;
  next();
};
