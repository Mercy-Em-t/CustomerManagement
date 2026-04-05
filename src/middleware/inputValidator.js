const Joi = require('joi');

const chatSchema = Joi.object({
  message: Joi.string().max(2000).required(),
  user_id: Joi.string().required(),
  business_id: Joi.string().required(),
});

function sanitizeInput(str) {
  // Strip characters that could be used for prompt injection
  return str
    .replace(/[`]/g, "'")
    .replace(/\{|\}/g, '')
    .replace(/<\|.*?\|>/g, '')
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
