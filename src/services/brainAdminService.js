const db = require('../db/client');
const businessRepository = require('../db/repositories/businessRepository');

class BrainAdminService {
  constructor(brainLoader) {
    this.brainLoader = brainLoader;
  }

  async getBrainMeta(businessId) {
    if (!db.isDbEnabled()) {
      return {
        business_id: businessId,
        brain_file: `${businessId}.json`,
      };
    }

    const business = await businessRepository.getById(businessId);
    if (!business) return null;

    return {
      business_id: business.id,
      brain_file: business.brain_file,
      name: business.name,
      created_at: business.created_at,
    };
  }

  async updateBrainConfig(businessId, brainConfig) {
    await this.brainLoader.validateBrain(brainConfig);
    return {
      business_id: businessId,
      valid: true,
      updated: false,
      note: 'Brain validation passed. Persisting config is file/db strategy dependent.',
    };
  }
}

module.exports = BrainAdminService;
