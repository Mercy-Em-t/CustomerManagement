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
| `BRAIN_CACHE_TTL` | Brain config cache in seconds | `300` |
| `MAX_CONVERSATION_HISTORY` | Messages kept in session | `20` |
| `API_KEYS` | Comma-separated `businessId:key` pairs | — |
| `WHATSAPP_VERIFY_TOKEN` | Verify token for webhook challenge | — |
| `WHATSAPP_APP_SECRET` | App secret for `x-hub-signature-256` verification | — |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API token for outbound replies | — |
| `WHATSAPP_PHONE_NUMBER_ID` | Default phone number ID used for outbound send | — |
| `WHATSAPP_PHONE_BUSINESS_MAP` | Comma-separated `phoneNumberId:businessId` map | — |
| `WHATSAPP_DEFAULT_BUSINESS_ID` | Fallback tenant if map misses | — |
| `WEBHOOK_DEDUPE_TTL_SECONDS` | Webhook idempotency TTL in seconds | `300` |
| `WHATSAPP_API_VERSION` | Graph API version for WhatsApp endpoint | `v20.0` |

### Running

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

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
  "cart": null
}
```

### GET `/api/orders/:userId/cart`

View a user's current cart.

### POST `/api/orders/:userId/checkout`

Confirm and checkout the current cart.

### DELETE `/api/orders/:userId/items/:productId`

Remove an item from the cart.

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
- **Rate limiting** — 100 requests per 15 minutes per IP
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

### Planned Extensions
- Brain Marketplace
- Brain Training (fine-tuning via conversations)
- A/B Testing brains
- Analytics dashboard (conversion rates, intent success)
- WhatsApp API integration
- M-Pesa / card payment integration
