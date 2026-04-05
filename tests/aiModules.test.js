const { buildPrompt } = require('../src/modules/ai/prompt.builder');
const { parseAIResponse } = require('../src/modules/ai/response.parser');

describe('AI modules', () => {
  test('buildPrompt includes products and memory', () => {
    const brain = {
      identity: { role: 'Sales Assistant', personality: 'Friendly', tone: 'Warm' },
      business_context: { industry: 'Retail' },
      response_rules: ['Be clear', 'Be polite'],
      sales_strategy: { approach: 'consultative' },
    };

    const prompt = buildPrompt(
      brain,
      'Do you have tea?',
      [{ name: 'Green Tea', price: 300 }],
      { history: [{ sender: 'user', message: 'Hi' }] }
    );

    expect(prompt).toContain('Green Tea - KES 300');
    expect(prompt).toContain('user: Hi');
    expect(prompt).toContain('Do you have tea?');
  });

  test('parseAIResponse parses valid JSON payload', () => {
    const result = parseAIResponse('{"reply":"Hello","intent":"greeting","confidence":0.9,"entities":{"a":1}}');
    expect(result.reply).toBe('Hello');
    expect(result.response).toBe('Hello');
    expect(result.intent).toBe('greeting');
    expect(result.confidence).toBe(0.9);
    expect(result.entities).toEqual({ a: 1 });
  });

  test('parseAIResponse falls back for non-JSON text', () => {
    const result = parseAIResponse('plain text');
    expect(result.reply).toBe('plain text');
    expect(result.intent).toBe('unknown');
    expect(result.confidence).toBe(0.3);
  });
});
