const express = require('express');
const router = express.Router();

module.exports = function analyticsRouter(analyticsService) {
  router.get('/summary', async (req, res) => {
    try {
      const summary = await analyticsService.getSummary(req.businessId);
      return res.json({ success: true, summary });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
