const SUPPORTED_INTENTS = require('./intentDetector').SUPPORTED_INTENTS;

class AIEngine {
  buildPrompt(brain, userMessage, conversationHistory) {
    const historyText = conversationHistory
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    return `You are ${brain.identity.role}.
Personality: ${brain.identity.personality}
Tone: ${brain.identity.tone}

Business Context:
Industry: ${brain.business_context.industry}
Products: ${brain.business_context.products_type}
Goal: ${brain.business_context.sales_goal}

Response Rules:
${brain.response_rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Sales Strategy: ${brain.sales_strategy.approach} approach. Upsell: ${brain.sales_strategy.upsell}. Cross-sell: ${brain.sales_strategy.cross_sell}.

${historyText ? `Conversation History:\n${historyText}\n` : ''}
User: ${userMessage}

Respond ONLY with valid JSON in this format:
{"response": "<your reply>", "intent": "<one of: ${SUPPORTED_INTENTS.join(', ')}>", "confidence": <0.0-1.0>, "entities": {}}`;
  }

  async processMessage(brain, userMessage, conversationHistory) {
    const config = require('../config');

    if (config.openaiApiKey) {
      return this._openAiResponse(brain, userMessage, conversationHistory, config.openaiApiKey);
    }
    return this._mockResponse(brain, userMessage);
  }

  async _openAiResponse(brain, userMessage, conversationHistory, apiKey) {
    const https = require('https');
    const prompt = this.buildPrompt(brain, userMessage, conversationHistory);

    const body = JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.openai.com',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            'Content-Length': Buffer.byteLength(body),
          },
        },
        res => {
          let data = '';
          res.on('data', chunk => (data += chunk));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0].message.content;
              resolve(JSON.parse(content));
            } catch (e) {
              resolve(this._mockResponse(brain, userMessage));
            }
          });
        }
      );
      req.on('error', () => resolve(this._mockResponse(brain, userMessage)));
      req.write(body);
      req.end();
    });
  }

  _mockResponse(brain, userMessage) {
    const lower = userMessage.toLowerCase();
    let intent = 'greeting';
    let response = brain.conversation_patterns.greeting || 'Hello! How can I help you?';

    if (lower.includes('price') || lower.includes('cost') || lower.includes('how much')) {
      intent = 'pricing';
      response = `I'd be happy to help with pricing information! Our products are competitively priced. Could you tell me which specific product you're interested in?`;
    } else if (lower.includes('buy') || lower.includes('purchase') || lower.includes('order') || lower.includes('add to cart')) {
      intent = 'purchase';
      response = `Great choice! I can help you with your purchase. Let me add that to your cart. Is there anything else you'd like to add?`;
    } else if (lower.includes('recommend') || lower.includes('suggest') || lower.includes('best')) {
      intent = 'recommendation';
      response = `Based on what you're looking for, I have some great recommendations! ${brain.business_context.products_type} are our specialty.`;
    } else if (lower.includes('ship') || lower.includes('deliver') || lower.includes('delivery')) {
      intent = 'logistics';
      response = `We offer fast and reliable shipping options. Standard delivery takes 3-5 business days, and express options are available.`;
    } else if (lower.includes('help') || lower.includes('how to') || lower.includes('use')) {
      intent = 'usage_help';
      response = `I'm here to help! ${brain.conversation_patterns.clarification || 'Could you tell me more about what you need?'}`;
    } else if (lower.includes('search') || lower.includes('find') || lower.includes('looking for')) {
      intent = 'product_search';
      response = `I can help you find exactly what you're looking for! We carry a wide range of ${brain.business_context.products_type}.`;
    } else if (lower.includes('problem') || lower.includes('issue') || lower.includes('complaint') || lower.includes('wrong')) {
      intent = 'complaint';
      response = `I'm sorry to hear you're having an issue. I want to make this right for you. Could you describe the problem in more detail?`;
    }

    return {
      response,
      intent,
      confidence: 0.85,
      entities: {},
    };
  }
}

module.exports = AIEngine;
