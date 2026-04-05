const express = require('express');
const request = require('supertest');

function buildWebhookPayload({ from = '254700000001', phoneNumberId = '12345', messageId = 'wamid.1', text = 'hi' } = {}) {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry_1',
        changes: [
          {
            field: 'messages',
            value: {
              metadata: { phone_number_id: phoneNumberId },
              messages: [
                {
                  id: messageId,
                  from,
                  type: 'text',
                  text: { body: text },
                },
              ],
            },
          },
        ],
      },
    ],
  };
}

describe('WhatsApp webhook route', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.WHATSAPP_APP_SECRET;
    delete process.env.WHATSAPP_ACCESS_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    process.env.WHATSAPP_VERIFY_TOKEN = 'verify_token';
    process.env.WHATSAPP_PHONE_BUSINESS_MAP = '12345:my_shop';
    process.env.WHATSAPP_DEFAULT_BUSINESS_ID = 'my_shop';
    process.env.WEBHOOK_DEDUPE_TTL_SECONDS = '300';
  });

  test('GET /webhooks/whatsapp verifies challenge', async () => {
    const webhooksRouter = require('../src/routes/webhooks');
    const app = express();
    app.use(express.json());
    app.use('/webhooks', webhooksRouter({ handleMessage: jest.fn() }));

    const res = await request(app)
      .get('/webhooks/whatsapp')
      .query({
        'hub.mode': 'subscribe',
        'hub.verify_token': 'verify_token',
        'hub.challenge': '123456',
      });

    expect(res.status).toBe(200);
    expect(res.text).toBe('123456');
  });

  test('POST /webhooks/whatsapp processes message and enforces idempotency', async () => {
    const orchestrator = {
      handleMessage: jest.fn().mockResolvedValue({ response: 'Welcome!' }),
    };
    const webhooksRouter = require('../src/routes/webhooks');
    const app = express();
    app.use(express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }));
    app.use('/webhooks', webhooksRouter(orchestrator));

    const payload = buildWebhookPayload();
    const first = await request(app).post('/webhooks/whatsapp').send(payload);
    const second = await request(app).post('/webhooks/whatsapp').send(payload);

    expect(first.status).toBe(200);
    expect(first.body.success).toBe(true);
    expect(first.body.processed).toBe(1);
    expect(second.status).toBe(200);
    expect(second.body.duplicate).toBe(true);
    expect(orchestrator.handleMessage).toHaveBeenCalledTimes(1);
    expect(orchestrator.handleMessage).toHaveBeenCalledWith('my_shop', '254700000001', 'hi');
  });

  test('POST /webhooks/whatsapp rejects invalid signature when app secret is set', async () => {
    process.env.WHATSAPP_APP_SECRET = 'topsecret';
    const webhooksRouter = require('../src/routes/webhooks');
    const app = express();
    app.use(express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf;
      },
    }));
    app.use('/webhooks', webhooksRouter({ handleMessage: jest.fn() }));

    const res = await request(app)
      .post('/webhooks/whatsapp')
      .set('x-hub-signature-256', 'sha256=bad')
      .send(buildWebhookPayload());

    expect(res.status).toBe(401);
  });
});
