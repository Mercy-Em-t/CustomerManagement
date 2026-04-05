const db = require('../client');

async function getByApiKey(apiKey) {
  const { rows } = await db.query(
    `SELECT id, name, api_key, brain_file, external_api_url, external_api_key, sync_mode, sync_status, sync_error, sync_last_synced_at, sync_updated_at, created_at
     FROM businesses
     WHERE api_key = $1
     LIMIT 1`,
    [apiKey]
  );
  return rows[0] || null;
}

async function getById(id) {
  const { rows } = await db.query(
    `SELECT id, name, api_key, brain_file, external_api_url, external_api_key, sync_mode, sync_status, sync_error, sync_last_synced_at, sync_updated_at, created_at
     FROM businesses
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function listWithExternalSyncEnabled() {
  const { rows } = await db.query(
    `SELECT id, name, api_key, brain_file, external_api_url, external_api_key, sync_mode, sync_status, sync_error, sync_last_synced_at, sync_updated_at, created_at
     FROM businesses
     WHERE external_api_url IS NOT NULL
       AND external_api_key IS NOT NULL
       AND COALESCE(sync_mode, 'manual') = 'scheduled'`
  );
  return rows;
}

async function updateSyncStatus(id, { sync_status, sync_error = null, sync_last_synced_at = null }) {
  const { rows } = await db.query(
    `UPDATE businesses
     SET sync_status = $2,
         sync_error = $3,
         sync_last_synced_at = COALESCE($4, sync_last_synced_at),
         sync_updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, name, api_key, brain_file, external_api_url, external_api_key, sync_mode, sync_status, sync_error, sync_last_synced_at, sync_updated_at, created_at`,
    [id, sync_status, sync_error, sync_last_synced_at]
  );
  return rows[0] || null;
}

async function updateSyncMode(id, syncMode) {
  const { rows } = await db.query(
    `UPDATE businesses
     SET sync_mode = $2,
         sync_updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, name, api_key, brain_file, external_api_url, external_api_key, sync_mode, sync_status, sync_error, sync_last_synced_at, sync_updated_at, created_at`,
    [id, syncMode]
  );
  return rows[0] || null;
}

module.exports = {
  getByApiKey,
  getById,
  listWithExternalSyncEnabled,
  updateSyncStatus,
  updateSyncMode,
};
