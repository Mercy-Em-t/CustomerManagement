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

  router.get('/products/status', async (req, res) => {
    try {
      const status = await productSyncService.getSyncStatus(req.businessId);
      return res.json({ success: true, status });
    } catch (err) {
      const statusCode = err.message === 'Business not found' ? 404 : 400;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  router.post('/products/mode', async (req, res) => {
    try {
      const mode = String((req.body || {}).sync_mode || '').toLowerCase();
      const result = await productSyncService.setSyncMode(req.businessId, mode);
      return res.json({ success: true, result });
    } catch (err) {
      const statusCode = err.message === 'Business not found' ? 404 : 400;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  router.post('/products/webhook', async (req, res) => {
    try {
      const result = await productSyncService.syncFromWebhook(req.businessId, req.body || {});
      return res.json({ success: true, result });
    } catch (err) {
      const statusCode = err.message === 'Business not found' ? 404 : 400;
      return res.status(statusCode).json({ error: err.message });
    }
  });

  return router;
};
