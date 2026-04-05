function buildPrompt(brain, message, products = [], memory = { history: [] }, recommendations = []) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeHistory = Array.isArray(memory.history) ? memory.history : [];
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
  const currency = (((brain || {}).business_context || {}).currency) || 'KES';

  return `You are a ${brain.identity.role}.

Personality: ${brain.identity.personality}
Tone: ${brain.identity.tone}

Business Context:
${brain.business_context.industry}

Rules:
${(brain.response_rules || []).join('\n')}

Sales Strategy:
${JSON.stringify(brain.sales_strategy || {})}

Available Products:
${safeProducts.map(p => `${p.name} - ${currency} ${p.price}`).join('\n')}

Conversation Memory:
${safeHistory.map(m => `${m.sender}: ${m.message}`).join('\n')}

Recommendations:
${safeRecommendations.map(p => `${p.name} - ${currency} ${p.price}`).join('\n')}

IMPORTANT:
Respond in JSON format:
{
  "reply": "string",
  "intent": "string",
  "confidence": number,
  "entities": {}
}

Customer Message:
"${message}"`;
}

module.exports = { buildPrompt };
