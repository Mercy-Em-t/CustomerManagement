const SUPPORTED_INTENTS = [
  'product_search',
  'pricing',
  'recommendation',
  'usage_help',
  'logistics',
  'purchase',
  'complaint',
  'greeting',
];

class IntentDetector {
  detect(aiOutput) {
    if (aiOutput && aiOutput.intent) {
      return this.validate(aiOutput.intent) ? aiOutput.intent : 'greeting';
    }
    return 'greeting';
  }

  validate(intent) {
    return SUPPORTED_INTENTS.includes(intent);
  }

  extractEntities(aiOutput) {
    if (aiOutput && aiOutput.entities && typeof aiOutput.entities === 'object') {
      return aiOutput.entities;
    }
    return {};
  }
}

module.exports = IntentDetector;
module.exports.SUPPORTED_INTENTS = SUPPORTED_INTENTS;
