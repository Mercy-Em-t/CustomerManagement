const express = require('express');
const router = express.Router();

module.exports = function productsRouter(productService) {
  const readOnlyError = {
    error: 'Products are read-only in API. Use sync endpoints (/api/sync/products or /api/sync/products/webhook).',
  };

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

  router.post('/', (req, res) => {
    return res.status(405).json(readOnlyError);
  });

  router.put('/:id', (req, res) => {
    return res.status(405).json(readOnlyError);
  });

  router.patch('/:id', (req, res) => {
    return res.status(405).json(readOnlyError);
  });

  router.delete('/:id', (req, res) => {
    return res.status(405).json(readOnlyError);
  });

  return router;
};
