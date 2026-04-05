const config = require('../config');
const db = require('../db/client');
const businessRepository = require('../db/repositories/businessRepository');
const path = require('path');

async function resolveBusinessByAuth(apiKey, businessIdHeader) {
  if (!apiKey) return null;

  if (db.isDbEnabled()) {
    const business = await businessRepository.getByApiKey(apiKey);
    if (!business) return null;
    if (businessIdHeader && business.id !== businessIdHeader) return null;
    return {
      id: business.id,
      name: business.name,
      brainFile: business.brain_file,
      brainId: path.basename(business.brain_file, '.json'),
      source: 'db',
    };
  }

  if (!businessIdHeader) return null;
  const expectedKey = config.apiKeys[businessIdHeader];
  if (!expectedKey || expectedKey !== apiKey) return null;

  return {
    id: businessIdHeader,
    name: businessIdHeader,
    brainFile: `${businessIdHeader}.json`,
    brainId: businessIdHeader,
    source: 'env',
  };
}

module.exports = {
  resolveBusinessByAuth,
};
