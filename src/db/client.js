const { Pool } = require('pg');
const config = require('../config');

let pool = null;

function isDbEnabled() {
  return Boolean(config.databaseUrl);
}

function getPool() {
  if (!isDbEnabled()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
      max: config.databasePoolMax,
      idleTimeoutMillis: config.databasePoolIdleTimeoutMs,
      connectionTimeoutMillis: config.databasePoolConnectionTimeoutMs,
    });
  }
  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  if (!p) {
    const err = new Error('Database disabled');
    err.code = 'DB_DISABLED';
    throw err;
  }
  return p.query(text, params);
}

async function transaction(callback) {
  const p = getPool();
  if (!p) {
    const err = new Error('Database disabled');
    err.code = 'DB_DISABLED';
    throw err;
  }

  const client = await p.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  isDbEnabled,
  getPool,
  query,
  transaction,
};
