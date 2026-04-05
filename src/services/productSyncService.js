const db = require('../db/client');
const businessRepository = require('../db/repositories/businessRepository');
const { syncProducts } = require('../modules/sync/product.sync');

class ProductSyncService {
  async syncBusinessProducts(businessId) {
    if (!db.isDbEnabled()) {
      return { synced: 0, skipped: true, reason: 'Database disabled' };
    }

    const business = await businessRepository.getById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    return syncProducts(business);
  }
}

module.exports = ProductSyncService;
