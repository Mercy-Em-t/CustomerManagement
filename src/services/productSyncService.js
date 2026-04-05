const db = require('../db/client');
const businessRepository = require('../db/repositories/businessRepository');
const { syncProducts, upsertProduct } = require('../modules/sync/product.sync');

class ProductSyncService {
  async syncBusinessProducts(businessId) {
    if (!db.isDbEnabled()) {
      return { synced: 0, skipped: true, reason: 'Database disabled' };
    }

    const business = await businessRepository.getById(businessId);
    if (!business) {
      throw new Error('Business not found');
    }

    await businessRepository.updateSyncStatus(businessId, {
      sync_status: 'running',
      sync_error: null,
    });

    try {
      const result = await syncProducts(business);
      await businessRepository.updateSyncStatus(businessId, {
        sync_status: 'success',
        sync_error: null,
        sync_last_synced_at: new Date(),
      });
      return result;
    } catch (err) {
      await businessRepository.updateSyncStatus(businessId, {
        sync_status: 'failed',
        sync_error: String(err.message || 'Unknown sync error').slice(0, 500),
      });
      throw err;
    }
  }

  async setSyncMode(businessId, syncMode) {
    if (!db.isDbEnabled()) {
      return { business_id: businessId, sync_mode: syncMode, updated: false, skipped: true };
    }
    if (!['manual', 'scheduled'].includes(syncMode)) {
      throw new Error('Invalid sync_mode. Allowed values: manual, scheduled');
    }
    const updated = await businessRepository.updateSyncMode(businessId, syncMode);
    if (!updated) {
      throw new Error('Business not found');
    }
    return {
      business_id: updated.id,
      sync_mode: updated.sync_mode,
      updated: true,
    };
  }

  async getSyncStatus(businessId) {
    if (!db.isDbEnabled()) {
      return {
        business_id: businessId,
        sync_mode: 'manual',
        sync_status: 'idle',
        sync_error: null,
        sync_last_synced_at: null,
        sync_updated_at: null,
      };
    }

    const business = await businessRepository.getById(businessId);
    if (!business) throw new Error('Business not found');

    return {
      business_id: business.id,
      sync_mode: business.sync_mode || 'manual',
      sync_status: business.sync_status || 'idle',
      sync_error: business.sync_error || null,
      sync_last_synced_at: business.sync_last_synced_at || null,
      sync_updated_at: business.sync_updated_at || null,
    };
  }

  async syncFromWebhook(businessId, payload) {
    if (!db.isDbEnabled()) {
      return { synced: 0, skipped: true, reason: 'Database disabled' };
    }
    if (!payload || !Array.isArray(payload.products)) {
      throw new Error('Invalid payload: expected { products: [...] }');
    }
    const business = await businessRepository.getById(businessId);
    if (!business) throw new Error('Business not found');

    await businessRepository.updateSyncStatus(businessId, {
      sync_status: 'running',
      sync_error: null,
    });

    try {
      const normalized = payload.products.map((p) => ({
        id: p.id || p.external_id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        tags: p.tags,
      }));

      for (const product of normalized) {
        await upsertProduct(product, business.id);
      }

      await businessRepository.updateSyncStatus(businessId, {
        sync_status: 'success',
        sync_error: null,
        sync_last_synced_at: new Date(),
      });

      return { synced: normalized.length, skipped: false, source: 'webhook' };
    } catch (err) {
      await businessRepository.updateSyncStatus(businessId, {
        sync_status: 'failed',
        sync_error: String(err.message || 'Unknown sync error').slice(0, 500),
      });
      throw err;
    }
  }

  async syncScheduledBusinesses() {
    if (!db.isDbEnabled()) return { triggered: 0, skipped: true, reason: 'Database disabled' };
    const businesses = await businessRepository.listWithExternalSyncEnabled();
    let triggered = 0;
    for (const business of businesses) {
      try {
        await this.syncBusinessProducts(business.id);
        triggered += 1;
      } catch (err) {
        // keep loop resilient and continue syncing other tenants
        console.error(`Scheduled product sync failed for ${business.id}:`, err.message);
      }
    }
    return { triggered, skipped: false };
  }
}

module.exports = ProductSyncService;
