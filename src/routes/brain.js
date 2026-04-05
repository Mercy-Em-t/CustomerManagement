const express = require('express');
const router = express.Router();

module.exports = function brainRouter(brainAdminService) {
  router.get('/', async (req, res) => {
    try {
      const brain = await brainAdminService.getBrainMeta(req.businessId);
      if (!brain) return res.status(404).json({ error: 'Business not found' });
      return res.json({ success: true, brain });
    } catch (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const result = await brainAdminService.updateBrainConfig(req.businessId, req.body || {});
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  });

  return router;
};
