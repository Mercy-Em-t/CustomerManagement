const https = require('https');
const db = require('../../db/client');
const productRepository = require('../../db/repositories/productRepository');

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, { method: 'GET', headers }, (res) => {
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
    req.end();
  });
}

async function fetchExternalProducts(business) {
  if (!business || !business.external_api_url || !business.external_api_key) {
    throw new Error('Business external sync credentials missing');
  }

  const payload = await fetchJson(business.external_api_url, {
    Authorization: `Bearer ${business.external_api_key}`,
  });

  return Array.isArray(payload) ? payload : [];
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
