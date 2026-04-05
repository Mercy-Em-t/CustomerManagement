const { resolveBusinessByAuth } = require('../services/authService');

module.exports = async function auth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const businessId = req.headers['x-business-id'];

  if (!apiKey || !businessId) {
    return res.status(401).json({ error: 'Missing x-api-key or x-business-id header' });
  }

  try {
    const business = await resolveBusinessByAuth(apiKey, businessId);
    if (!business) {
      return res.status(401).json({ error: 'Invalid API key for this business' });
    }

    req.businessId = business.id;
    req.business = business;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
