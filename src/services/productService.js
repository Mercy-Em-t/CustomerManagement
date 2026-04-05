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
}

module.exports = ProductService;
