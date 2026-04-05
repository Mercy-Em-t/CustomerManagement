const express = require('express');
const router = express.Router();

module.exports = function ordersRouter(orderEngine) {
  router.get('/:userId/cart', (req, res) => {
    try {
      const cart = orderEngine.viewCart(req.params.userId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:userId/checkout', (req, res) => {
    try {
      const order = orderEngine.checkout(req.params.userId);
      res.json({ success: true, order });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:userId/items/:productId', (req, res) => {
    try {
      const cart = orderEngine.removeItem(req.params.userId, req.params.productId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
};
