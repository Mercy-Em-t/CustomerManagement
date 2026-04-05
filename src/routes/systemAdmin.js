const express = require('express');
const router = express.Router();

const V1_USER_MANUAL = `# AI SALES ENGINE — V1 USER MANUAL

## 1) System Overview
- Purpose: Multi-tenant AI platform that automates sales with recommendations, order support, and conversion guidance.
- Key V1 features:
  - Multi-shop brain loader
  - Product catalog sync from external systems
  - WhatsApp + web chat
  - Order management + cart builder
  - Conversion optimization (upsell/cross-sell)
  - Conversation logging for future training
- Primary users:
  - Shop Admin
  - System Admin
  - End Customer

## 2) Accessing the System
1. Admin Panel: https://<your-domain>/admin
2. Shop Admin:
   - Access per-shop panel using assigned API key
   - Manage products, view orders, sync external catalog
3. Customers:
   - Interact via WhatsApp or embedded web chat
   - Receive recommendations and place orders

## 3) Shop Admin Guide
### A. Product Management
1. Sync Products:
   - Admin -> Product Sync -> Pull Products
2. Add Products Manually (optional):
   - Admin -> Products -> Add New
   - Fields: name, description, price, category, tags (optional), stock
Note: Sync first to avoid inconsistent prices.

### B. Managing AI Brain
1. Brain Loader:
   - Per-shop JSON file (example: brains/wellness.json)
2. Update Brain:
   - Upload JSON via Admin -> AI Brain
3. Best Practices:
   - Keep responses concise
   - Keep knowledge scope accurate

### C. Orders & Cart
- Track order ID, customer, products, total, status
- Edits allowed only before checkout confirmation

### D. Conversion Optimizer
- Uses rules from modules/conversion_optimizer/rules.json
- Admin can update upsell/cross-sell/nudge rules

### E. Conversation Logging & AI Training
- View logs with user message, AI reply, intent, entities
- Add feedback to improve performance
- V1 focus: logging/export; advanced fine-tuning later

## 4) Customer Interaction Flow
1. Greeting
2. Intent/entity detection
3. Recommendation
4. Add to cart
5. Upsell/cross-sell nudges
6. Checkout confirmation

## 5) Deployment & Admin Setup
Required .env variables:
OPENAI_API_KEY=your_openai_key
API_KEYS={"shop_001":"shop1apikey"}
DB_URL=your_database_connection_string

Testing checklist:
- Brain loader works
- Product sync works
- AI responds on WhatsApp + web
- Cart/order flow works
- Conversion suggestions appear

## 6) Troubleshooting
- AI not responding: verify brain JSON
- Products not updated: verify API key + external integration
- Missing suggestions: verify rules.json
- Orders not saving: verify DB connection

## 7) V1 Scope Notes
- No need for fine-tuning, marketplace, or advanced A/B testing in V1
- Focus on product sync, core AI sales, and order handling
- Use logs + feedback for next iterations
`;

module.exports = function systemAdminRouter() {
  router.get('/manual', async (req, res) => {
    return res.json({
      success: true,
      manual: {
        title: 'AI SALES ENGINE — V1 USER MANUAL',
        format: 'markdown',
        content: V1_USER_MANUAL,
      },
    });
  });

  return router;
};
