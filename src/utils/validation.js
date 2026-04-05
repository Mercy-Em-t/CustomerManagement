// Shared validation helpers used across middleware and engines
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

function isValidId(id) {
  return typeof id === 'string' && SAFE_ID_PATTERN.test(id);
}

module.exports = { SAFE_ID_PATTERN, isValidId };
