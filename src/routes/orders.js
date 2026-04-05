const express = require('express');
const router = express.Router();
const { isValidId } = require('../utils/validation');

function validateUserId(req, res, next) {
  if (!isValidId(req.params.userId)) {
    return res.status(400).json({ error: 'Invalid user ID format' });
  }
  next();
}

module.exports = function ordersRouter(orderEngine) {
  router.get('/:userId/cart', validateUserId, async (req, res) => {
    try {
      const cart = await orderEngine.viewCart(req.businessId, req.params.userId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:userId/checkout', validateUserId, async (req, res) => {
    try {
      const order = await orderEngine.checkout(req.businessId, req.params.userId);
      res.json({ success: true, order });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  router.delete('/:userId/items/:productId', validateUserId, async (req, res) => {
    try {
      const cart = await orderEngine.removeItem(req.businessId, req.params.userId, req.params.productId);
      res.json({ success: true, cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/:userId/items/:productId', validateUserId, async (req, res) => {
    try {
      const quantity = Number((req.body || {}).quantity || 1);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        return res.status(400).json({ error: 'quantity must be a positive number' });
      }

      const cart = await orderEngine.addItem(req.businessId, req.params.userId, {
        product_id: req.params.productId,
        quantity,
        price: Number((req.body || {}).price || 0),
      });
      return res.json({ success: true, cart });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  });

  router.patch('/:userId/items/:productId', validateUserId, async (req, res) => {
    try {
      const quantity = Number((req.body || {}).quantity);
      if (!Number.isFinite(quantity)) {
        return res.status(400).json({ error: 'quantity must be a number' });
      }
      const cart = await orderEngine.updateQuantity(req.businessId, req.params.userId, req.params.productId, quantity);
      return res.json({ success: true, cart });
    } catch (err) {
      const status = err.message === 'Item not found in cart' ? 404 : 500;
      return res.status(status).json({ error: err.message });
    }
  });

  return router;
};
