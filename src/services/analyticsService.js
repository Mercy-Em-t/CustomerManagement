const analyticsRepository = require('../db/repositories/analyticsRepository');
const db = require('../db/client');
const orderRepository = require('../db/repositories/orderRepository');
const productRepository = require('../db/repositories/productRepository');

class AnalyticsService {
  async getSummary(businessId) {
    if (!db.isDbEnabled()) {
      return { topIntents: [], conversionRate: 0, topProducts: [], ordersCount: 0 };
    }

    const [topIntents, conversionRate, orders, products] = await Promise.all([
      analyticsRepository.getIntentSummary(businessId, 10),
      analyticsRepository.getConversionRate(businessId),
      orderRepository.listByBusiness(businessId, 200),
      productRepository.listByBusiness(businessId),
    ]);

    const topProducts = products
      .map((p) => ({ id: p.id, name: p.name, stock: Number(p.stock || 0) }))
      .sort((a, b) => b.stock - a.stock)
      .slice(0, 5);

    return {
      topIntents,
      conversionRate,
      topProducts,
      ordersCount: orders.length,
    };
  }
}

module.exports = AnalyticsService;
