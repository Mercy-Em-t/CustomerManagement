const db = require('../db/client');
const productRepository = require('../db/repositories/productRepository');

class ProductService {
  async listProducts(businessId) {
    if (!db.isDbEnabled()) return [];
    return productRepository.listByBusiness(businessId);
  }

  async getProduct(businessId, productId) {
    if (!db.isDbEnabled()) return null;
    return productRepository.getById(businessId, productId);
  }

  async findByNameLike(businessId, productName) {
    if (!db.isDbEnabled()) return null;
    if (!productName || typeof productName !== 'string') return null;
    const products = await productRepository.listByBusiness(businessId);
    const needle = productName.toLowerCase();
    return products.find((p) => String(p.name || '').toLowerCase().includes(needle)) || null;
  }
}

module.exports = ProductService;
