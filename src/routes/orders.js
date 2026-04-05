const express = require('express');
const router = express.Router();

function validateUserId(req, res, next) {
  if (!/^[a-zA-Z0-9_-]+$/.test(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid user ID format. Only alphanumeric characters, underscores, and hyphens are allowed.' });
  }
  next();
}

module.exports = function ordersRouter(orderEngine) {
  router.get('/:userId/cart', validateUserId, (req, res) => {
    try {
      const cart = orderEngine.viewCart(req.params.userId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:userId/checkout', validateUserId, (req, res) => {
    try {
      const order = orderEngine.checkout(req.params.userId);
      res.json({ success: true, order });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:userId/items/:productId', validateUserId, (req, res) => {
    try {
      const cart = orderEngine.removeItem(req.params.userId, req.params.productId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
