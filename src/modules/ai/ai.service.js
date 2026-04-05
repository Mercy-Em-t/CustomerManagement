const https = require('https');
const { buildPrompt } = require('./prompt.builder');
const { parseAIResponse } = require('./response.parser');

async function processMessage({ brain, message, products = [], memory = { history: [] }, openaiApiKey }) {
  const prompt = buildPrompt(brain, message, products, memory);

  if (!openaiApiKey) {
    return {
      reply: 'Let me help you with that 😊',
      response: 'Let me help you with that 😊',
      intent: 'unknown',
      confidence: 0.5,
      entities: {},
    };
  }

  const body = JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  });

  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const text = (((parsed || {}).choices || [])[0] || {}).message?.content || '';
            resolve(parseAIResponse(text));
          } catch (err) {
            resolve({
              reply: 'Let me help you with that 😊',
              response: 'Let me help you with that 😊',
              intent: 'unknown',
              confidence: 0.5,
              entities: {},
            });
          }
        });
      }
    );

    req.on('error', () => {
      resolve({
        reply: 'Let me help you with that 😊',
        response: 'Let me help you with that 😊',
        intent: 'unknown',
        confidence: 0.5,
        entities: {},
      });
    });

    req.write(body);
    req.end();
  });
}

module.exports = { processMessage };
