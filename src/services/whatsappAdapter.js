const https = require('https');
const config = require('../config');

function parseInboundMessages(body) {
  const messages = [];
  const entries = Array.isArray(body && body.entry) ? body.entry : [];

  entries.forEach(entry => {
    const changes = Array.isArray(entry.changes) ? entry.changes : [];
    changes.forEach(change => {
      const value = (change || {}).value || {};
      const metadata = value.metadata || {};
      const phoneNumberId = metadata.phone_number_id || config.whatsappPhoneNumberId || '';
      const businessId = config.whatsappPhoneBusinessMap[phoneNumberId] || config.whatsappDefaultBusinessId || '';
      const inbound = Array.isArray(value.messages) ? value.messages : [];

      inbound.forEach(message => {
        if (!message || message.type !== 'text') return;
        const text = ((message.text || {}).body || '').trim();
        if (!text) return;
        messages.push({
          messageId: message.id,
          userId: message.from,
          message: text,
          phoneNumberId,
          businessId,
        });
      });
    });
  });

  return messages;
}

function sendTextMessage(to, text) {
  if (!config.whatsappPhoneNumberId || !config.whatsappAccessToken) {
    console.warn('WhatsApp outbound message skipped: missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return Promise.resolve({ skipped: true });
  }

  const body = JSON.stringify({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { body: text },
  });

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'graph.facebook.com',
        path: `/${config.whatsappApiVersion}/${config.whatsappPhoneNumberId}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.whatsappAccessToken}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            return resolve({ success: true });
          }
          reject(new Error(`WhatsApp send failed (${res.statusCode}): ${data}`));
        });
      }
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

module.exports = {
  parseInboundMessages,
  sendTextMessage,
};
