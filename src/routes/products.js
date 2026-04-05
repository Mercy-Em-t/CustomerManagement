const express = require('express');
const router = express.Router();

module.exports = function productsRouter(productService) {
  router.get('/', async (req, res) => {
    try {
      const products = await productService.listProducts(req.businessId);
      res.json({ success: true, products });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const product = await productService.getProduct(req.businessId, req.params.id);
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true, product });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
