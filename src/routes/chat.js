const express = require('express');
const router = express.Router();
const inputValidator = require('../middleware/inputValidator');

module.exports = function chatRouter(orchestrator) {
  router.post('/', inputValidator, async (req, res) => {
    try {
      const { message, user_id, business_id } = req.body;
      const result = await orchestrator.handleMessage(business_id, user_id, message);
      res.json({
        success: true,
        response: result.response,
        intent: result.intent,
        cart: result.cart || null,
      });
    } catch (err) {
      if (err.message && err.message.includes('Brain config not found')) {
        return res.status(404).json({ error: err.message });
      }
      console.error('Chat handler error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
