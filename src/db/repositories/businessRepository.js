const db = require('../client');

async function getByApiKey(apiKey) {
  const { rows } = await db.query(
    'SELECT id, name, api_key, brain_file, created_at FROM businesses WHERE api_key = $1 LIMIT 1',
    [apiKey]
  );
  return rows[0] || null;
}

async function getById(id) {
  const { rows } = await db.query(
    'SELECT id, name, api_key, brain_file, created_at FROM businesses WHERE id = $1 LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  getByApiKey,
  getById,
};
