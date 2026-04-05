const express = require('express');
const config = require('../config');
const webhookSignature = require('../middleware/webhookSignature');
const webhookIdempotency = require('../middleware/webhookIdempotency');
const { parseInboundMessages, sendTextMessage } = require('../services/whatsappAdapter');

const router = express.Router();

module.exports = function webhooksRouter(orchestrator) {
  router.get('/whatsapp', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const challengeStr = typeof challenge === 'string' ? challenge : '';

    if (
      mode === 'subscribe' &&
      token === config.whatsappVerifyToken &&
      /^[a-zA-Z0-9_-]{1,200}$/.test(challengeStr)
    ) {
      return res.status(200).type('text/plain').send(challengeStr);
    }
    return res.status(403).json({ error: 'Verification failed' });
  });

  router.post('/whatsapp', webhookSignature, webhookIdempotency, async (req, res) => {
    try {
      const inbound = parseInboundMessages(req.body);
      if (!inbound.length) return res.status(200).json({ success: true, ignored: true });

      for (const msg of inbound) {
        const result = await orchestrator.handleMessage(msg.businessId, msg.userId, msg.message);
        const responseText = (result && result.response) || 'Thanks! We received your message.';
        await sendTextMessage(msg.userId, responseText);
      }

      return res.status(200).json({ success: true, processed: inbound.length });
    } catch (err) {
      console.error('WhatsApp webhook error:', err.message);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
};
