const crypto = require('crypto');
const config = require('../config');

module.exports = function webhookSignature(req, res, next) {
  if (!config.whatsappAppSecret) {
    return next();
  }

  const signature = req.get('x-hub-signature-256');
  if (!signature || !signature.startsWith('sha256=')) {
    return res.status(401).json({ error: 'Missing or invalid webhook signature' });
  }

  const payload = req.rawBody || Buffer.from('');
  const expectedDigest = crypto
    .createHmac('sha256', config.whatsappAppSecret)
    .update(payload)
    .digest('hex');
  const expected = `sha256=${expectedDigest}`;

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return res.status(401).json({ error: 'Webhook signature verification failed' });
  }

  next();
};
