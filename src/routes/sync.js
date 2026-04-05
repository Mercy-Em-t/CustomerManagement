const express = require('express');
const router = express.Router();

module.exports = function syncRouter(productSyncService) {
  router.post('/products', async (req, res) => {
    try {
      const result = await productSyncService.syncBusinessProducts(req.businessId);
      return res.json({ success: true, result });
    } catch (err) {
      const status = err.message === 'Business not found' ? 404 : 400;
      return res.status(status).json({ error: err.message });
    }
  });

  return router;
};
