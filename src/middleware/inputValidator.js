const Joi = require('joi');

const chatSchema = Joi.object({
  message: Joi.string().max(2000).required(),
  user_id: Joi.string().required(),
  business_id: Joi.string().required(),
});

function sanitizeInput(str) {
  return str
    .replace(/[`]/g, "'")           // backticks can break code-block injection in prompts
    // Curly braces are blocked intentionally: they are the primary vector for template-injection
    // attacks in LLM prompts (e.g. injecting {system} overrides). Trade-off: users cannot
    // include literal braces in messages, which is acceptable for a sales chat interface.
    .replace(/\{|\}/g, '')
    .replace(/<\|.*?\|>/g, '')      // special delimiters used by some LLM tokenizers (e.g. <|endoftext|>)
    .trim();
}

module.exports = function inputValidator(req, res, next) {
  const { error, value } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  value.message = sanitizeInput(value.message);
  req.body = value;
  next();
};
