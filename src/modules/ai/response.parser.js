function parseAIResponse(text) {
  try {
    const parsed = JSON.parse(text);
    const reply = typeof parsed.reply === 'string' ? parsed.reply : text;
    const intent = typeof parsed.intent === 'string' ? parsed.intent : 'unknown';
    const confidence = Number.isFinite(Number(parsed.confidence)) ? Number(parsed.confidence) : 0.3;
    const entities = parsed.entities && typeof parsed.entities === 'object' ? parsed.entities : {};

    return {
      reply,
      response: reply,
      intent,
      confidence,
      entities,
    };
  } catch (e) {
    return {
      reply: text,
      response: text,
      intent: 'unknown',
      confidence: 0.3,
      entities: {},
    };
  }
}

module.exports = { parseAIResponse };
