const db = require('../db/client');
const businessRepository = require('../db/repositories/businessRepository');
const fs = require('fs').promises;
const path = require('path');

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
    const brainsDir = path.resolve(__dirname, '../../brains');
    const safeFileName = `${String(businessId).replace(/[^a-zA-Z0-9_-]/g, '')}.json`;
    const brainPath = path.join(brainsDir, safeFileName);
    await fs.writeFile(brainPath, `${JSON.stringify(brainConfig, null, 2)}\n`, 'utf8');
    this.brainLoader.clearCache(businessId);
    return {
      business_id: businessId,
      valid: true,
      updated: true,
      note: 'Brain validation passed and config saved.',
    };
  }
}

module.exports = BrainAdminService;
