const NodeCache = require('node-cache');
const fs = require('fs').promises;
const path = require('path');

const REQUIRED_BRAIN_FIELDS = [
  'identity',
  'business_context',
  'knowledge_scope',
  'intent_map',
  'response_rules',
  'sales_strategy',
  'conversation_patterns',
];

class BrainLoader {
  constructor(cacheTTL = 300) {
    this.cache = new NodeCache({ stdTTL: cacheTTL, useClones: false });
  }

  async loadBrain(businessId) {
    if (!/^[a-zA-Z0-9_-]+$/.test(businessId)) {
      throw new Error(`Brain config not found for business: ${businessId}`);
    }

    const cached = this.cache.get(businessId);
    if (cached) return cached;

    const brainsDir = path.resolve(__dirname, '../../brains');
    // Use path.basename to strip any path separators before constructing the file path
    const safeFileName = path.basename(businessId) + '.json';
    const brainPath = path.join(brainsDir, safeFileName);
    // Guard: ensure resolved path is inside the brains directory
    if (!brainPath.startsWith(brainsDir + path.sep) && brainPath !== brainsDir) {
      throw new Error(`Brain config not found for business: ${businessId}`);
    }
    let raw;
    try {
      raw = await fs.readFile(brainPath, 'utf8');
    } catch (err) {
      throw new Error(`Brain config not found for business: ${businessId}`);
    }

    const brain = JSON.parse(raw);
    await this.validateBrain(brain);
    this.cache.set(businessId, brain);
    return brain;
  }

  async validateBrain(brain) {
    for (const field of REQUIRED_BRAIN_FIELDS) {
      if (!(field in brain)) {
        throw new Error(`Brain config missing required field: ${field}`);
      }
    }
    return true;
  }

  clearCache(businessId) {
    if (businessId) {
      this.cache.del(businessId);
    } else {
      this.cache.flushAll();
    }
  }
}

module.exports = BrainLoader;
