const https = require('https');
const db = require('../../db/client');
const productRepository = require('../../db/repositories/productRepository');
const config = require('../../config');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchJson(url, headers = {}, timeoutMs = config.productSyncTimeoutMs) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers, timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`External sync failed (${res.statusCode})`));
        }
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error('Invalid JSON from external product API'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('External sync request timed out'));
    });
    req.end();
  });
}

async function fetchExternalProducts(business) {
  if (!business || !business.external_api_url || !business.external_api_key) {
    throw new Error('Business external sync credentials missing');
  }

  let lastError;
  for (let attempt = 0; attempt <= config.productSyncRetryCount; attempt += 1) {
    try {
      const payload = await fetchJson(
        business.external_api_url,
        { Authorization: `Bearer ${business.external_api_key}` },
        config.productSyncTimeoutMs
      );
      return Array.isArray(payload) ? payload : [];
    } catch (err) {
      lastError = err;
      if (attempt < config.productSyncRetryCount) {
        const delay = config.productSyncRetryBaseMs * (2 ** attempt);
        await wait(delay);
      }
    }
  }

  throw lastError || new Error('External sync failed');
}

async function upsertProduct(product, businessId) {
  if (!product || !product.id || !product.name) return;

  const normalized = {
    external_id: String(product.id),
    name: String(product.name),
    description: product.description ? String(product.description) : null,
    price: Number(product.price) || 0,
    stock: Number(product.stock) || 0,
    category: product.category ? String(product.category) : null,
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
  };

  await productRepository.upsertByExternalId(businessId, normalized);
}

async function syncProducts(business) {
  if (!db.isDbEnabled()) {
    return { synced: 0, skipped: true, reason: 'Database disabled' };
  }

  const externalProducts = await fetchExternalProducts(business);

  for (const ext of externalProducts) {
    await upsertProduct(ext, business.id);
  }

  return { synced: externalProducts.length, skipped: false };
}

module.exports = {
  syncProducts,
  fetchExternalProducts,
  upsertProduct,
};
