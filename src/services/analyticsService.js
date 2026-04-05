const analyticsRepository = require('../db/repositories/analyticsRepository');
const db = require('../db/client');

class AnalyticsService {
  async getSummary(businessId) {
    if (!db.isDbEnabled()) {
      return {
        topIntents: [],
        conversionRate: 0,
      };
    }

    const [topIntents, conversionRate] = await Promise.all([
      analyticsRepository.getIntentSummary(businessId, 10),
      analyticsRepository.getConversionRate(businessId),
    ]);

    return {
      topIntents,
      conversionRate,
    };
  }
}

module.exports = AnalyticsService;
