# SalesBrain – Multi-Tenant AI Sales Engine

> One system. Multiple businesses. Each powered by a different brain.

SalesBrain is a **multi-tenant AI-powered sales assistant platform** that allows different businesses to load a custom "AI Brain", interact with customers via chat (WhatsApp, web widget, etc.), and guide users from inquiry → recommendation → purchase — all running on the same backend infrastructure with a different Brain Config (JSON) per business.

---

## Architecture

```
[ Client (WhatsApp/Web) ]
          ↓
   [ API Gateway ]           ← auth, rate-limit, input validation
          ↓
   [ Orchestrator ]          ← identifies tenant, controls full flow
      /    |     \
     ↓     ↓      ↓
Brain   AI Engine  Order Engine
Loader             ↕
          Memory Engine
          ↓
     [ Database / Cache ]
```

### Core Components

| Component | File | Responsibility |
|-----------|------|---------------|
| Brain Loader | `src/engines/brainLoader.js` | Loads & caches per-tenant JSON brain configs |
| AI Engine | `src/engines/aiEngine.js` | Builds LLM prompts, processes responses |
| Order Engine | `src/engines/orderEngine.js` | Cart management (add/remove/checkout) |
| Memory Engine | `src/engines/memoryEngine.js` | Conversation state & history |
| Intent Detector | `src/engines/intentDetector.js` | Extracts intent from AI output |
| Orchestrator | `src/orchestrator.js` | Coordinates all engines per request |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- PostgreSQL 14+ (optional for persistence)

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `OPENAI_API_KEY` | OpenAI key (optional – falls back to mock) | — |
| `DATABASE_URL` | PostgreSQL URL (enables DB-backed persistence/auth) | — |
| `DATABASE_SSL` | Enable DB SSL connection | `false` |
| `DB_POOL_MAX` | Max DB pool connections | `10` |
| `DB_POOL_IDLE_TIMEOUT_MS` | DB idle timeout in ms | `30000` |
| `DB_POOL_CONNECTION_TIMEOUT_MS` | DB connection timeout in ms | `5000` |
| `BRAIN_CACHE_TTL` | Brain config cache in seconds | `300` |
| `MAX_CONVERSATION_HISTORY` | Messages kept in session | `20` |
| `API_KEYS` | Comma-separated `businessId:key` pairs (fallback when DB disabled) | — |
| `WHATSAPP_VERIFY_TOKEN` | Verify token for webhook challenge | — |
| `WHATSAPP_APP_SECRET` | App secret for `x-hub-signature-256` verification | — |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API token for outbound replies | — |
| `WHATSAPP_PHONE_NUMBER_ID` | Default phone number ID used for outbound send | — |
| `WHATSAPP_PHONE_BUSINESS_MAP` | Comma-separated `phoneNumberId:businessId` map | — |
| `WHATSAPP_DEFAULT_BUSINESS_ID` | Fallback tenant if map misses | — |
| `WEBHOOK_DEDUPE_TTL_SECONDS` | Webhook idempotency TTL in seconds | `300` |
| `WHATSAPP_API_VERSION` | Graph API version for WhatsApp endpoint | `v20.0` |
| `PRODUCT_SYNC_INTERVAL_SECONDS` | Scheduled sync interval for businesses using `scheduled` mode | `300` |
| `PRODUCT_SYNC_TIMEOUT_MS` | Timeout per external product sync request | `10000` |
| `PRODUCT_SYNC_RETRY_COUNT` | Number of retries for failed external sync calls | `2` |
| `PRODUCT_SYNC_RETRY_BASE_MS` | Base backoff duration for sync retries | `500` |

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Frontend Chat UI (React + Vite)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Default frontend expects backend at `http://localhost:3000`.

### Database Migrations

```bash
npm run migrate
```

Runs SQL migrations in `migrations/` in lexical order.

---

## API Reference

### Authentication

Every request must include:

```
x-api-key: <your_api_key>
x-business-id: <your_business_id>
```

### POST `/api/chat`

Send a customer message and receive an AI response.

**Request body:**
```json
{
  "message": "Do you have chia seeds?",
  "user_id": "user_123",
  "business_id": "health_shop"
}
```

**Response:**
```json
{
  "success": true,
  "response": "Yes! We carry organic chia seeds in 250g and 500g packs...",
  "intent": "product_search",
  "cart": null,
  "recommendations": []
}
```

### GET `/api/orders/:userId/cart`

View a user's current cart.

### POST `/api/orders/:userId/checkout`

Confirm and checkout the current cart.

### DELETE `/api/orders/:userId/items/:productId`

Remove an item from the cart.

### POST `/api/orders/:userId/items/:productId`

Add an item to cart (`quantity`, `price` in body).

### PATCH `/api/orders/:userId/items/:productId`

Update item quantity (`quantity` in body).

### GET `/api/products`

List products for the authenticated business.

### GET `/api/products/:id`

Get a single product for the authenticated business.

> Product catalog is **read-only** via `/api/products`; mutations must happen through sync endpoints.

### GET `/api/brain`

Get brain metadata for the authenticated business.

### POST `/api/brain`

Validate and save/publish submitted brain configuration payload.

### GET `/api/sync/products/status`

Get per-business sync status (`sync_mode`, `sync_status`, `sync_error`, `sync_last_synced_at`).

### POST `/api/sync/products/mode`

Set sync mode to `manual` or `scheduled`:

```json
{ "sync_mode": "scheduled" }
```

### POST `/api/sync/products/webhook`

Push product catalog updates from external POS:

```json
{
  "products": [
    {
      "id": "WELL-001",
      "name": "Organic Chia Seeds 500g",
      "price": 650,
      "stock": 120,
      "category": "superfoods",
      "tags": ["weight-loss", "fiber"]
    }
  ]
}
```

### GET `/health`

Health check endpoint (no auth required).

### GET `/webhooks/whatsapp`

Webhook verification endpoint for WhatsApp Cloud API challenge.

### POST `/webhooks/whatsapp`

Inbound WhatsApp messages endpoint. The server:
- verifies webhook signatures (when app secret is configured)
- deduplicates already-processed message IDs
- maps inbound `phone_number_id` to tenant business
- calls the orchestrator and sends assistant replies back to WhatsApp

---

## Brain Configuration

Each business gets a JSON brain file at `brains/{business_id}.json`:

```json
{
  "identity": {
    "role": "Sales Assistant for VitaShop",
    "personality": "Warm, knowledgeable, health-focused",
    "tone": "friendly and informative"
  },
  "business_context": {
    "industry": "Health & Wellness",
    "products_type": "Superfoods, supplements, organic products",
    "sales_goal": "Help customers find the right health products"
  },
  "knowledge_scope": {
    "can_answer": ["product availability", "pricing", "nutritional info", "usage tips"],
    "limitations": ["Cannot give medical advice", "Cannot process payments directly"]
  },
  "intent_map": ["product_search", "pricing", "recommendation", "purchase", "usage_help"],
  "response_rules": [
    "Always greet customers warmly",
    "Provide nutritional context when discussing products",
    "Recommend bundles when relevant"
  ],
  "sales_strategy": {
    "approach": "consultative",
    "upsell": true,
    "cross_sell": true,
    "closing_style": "gentle"
  },
  "conversation_patterns": {
    "greeting": "Welcome to VitaShop! How can I help you on your health journey today?",
    "clarification": "Could you tell me more about your health goals?",
    "closing": "Is there anything else I can help you with today?"
  }
}
```

Sample brains are included for:
- `demo_store` — General electronics/accessories retail
- `health_shop` — Health & wellness superfoods store
- `my_shop` — Live integration starter brain for first production tenant

---

## Supported Intents

| Intent | Description |
|--------|-------------|
| `product_search` | Customer looking for a product |
| `pricing` | Questions about price |
| `recommendation` | Asking for suggestions |
| `usage_help` | How to use a product |
| `logistics` | Delivery/shipping questions |
| `purchase` | Ready to buy |
| `complaint` | Issue or complaint |
| `greeting` | Opening message |

---

## Security

- **API key authentication** — per-tenant keys via `x-api-key` header
- **Rate limiting** — 100 requests per 15 minutes per API key (fallback to IP)
- **Input validation** — Joi schema enforcement on all inputs
- **Prompt injection protection** — sanitization of user input before LLM injection
- **Path traversal prevention** — business IDs validated before file access

---

## Testing

```bash
npm test
```

Tests cover:
- Brain Loader (load, cache, validate, error handling)
- Order Engine (add/remove/update/checkout)
- Webhooks (verification, idempotency, signature checks)

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Live production version |
| `production` | Pre-production staging |
| `development` | Active development |

Only push to `main` for live, verified releases.

---

## Extending

### Add a new business brain
1. Create `brains/{your_business_id}.json` following the schema above
2. Add your API key pair to `API_KEYS` in `.env`
3. Test via POST `/api/chat` with `business_id` set to your new brain ID

### Connect a real LLM
Set `OPENAI_API_KEY` in `.env`. The AI Engine will automatically use the OpenAI API instead of the built-in mock responses.

### Inventory onboarding
1. Use `/inventory/shop_inventory_template.csv` as the canonical CSV shape.
2. Keep required columns: `external_id,name,price,stock,category`.
3. Optional columns: `description,tags` (`tags` uses `|` separator).
4. Import helper is available at `src/modules/sync/inventoryImport.js`.
5. Shop 1 ready assets:
   - Shop profile: `/config/shop_001.json`
   - Catalog: `/inventory/shop_001_catalog.csv`
   - Brain: `/brains/shop_001.json`

### Quick messy-list conversion
For fast onboarding text like:
`chia seeds 300, pumpkin seeds 250, oats 150`

Use `parseMessyProductList` from `src/modules/sync/inventoryImport.js` to convert into normalized, system-ready product objects.

### Stress testing conversations
Use `tests/stress_conversations.json` as a scripted pack of launch-critical conversation journeys with explicit pass/fail criteria (discovery, usage, add-to-cart, upsell, checkout, out-of-stock, logistics, complaints).

### Deployment checklist (Railway + Vercel)
- Backend (Railway): set DB + WhatsApp + sync env vars, run `npm run migrate`, verify `/health`.
- Frontend (Vercel): set `VITE_API_BASE_URL`, `VITE_API_KEY`, `VITE_BUSINESS_ID`, `VITE_USER_ID`.
- Smoke tests: API auth, `/api/sync/products`, WhatsApp webhook verification + message reply, analytics summary endpoint.

### Rollout Path (Design → Code)
1. Set `DATABASE_URL` and run `npm run migrate`
2. Seed `businesses` with `api_key` + `brain_file`
3. Send `x-api-key` + `x-business-id` headers on API requests
4. Verify chat/cart/products/brain routes in DB mode
5. Keep `API_KEYS` only for fallback environments

### Planned Extensions
- Brain Marketplace
- Brain Training (fine-tuning via conversations)
- A/B Testing brains
- Analytics dashboard (conversion rates, intent success)
- M-Pesa / card payment integration
