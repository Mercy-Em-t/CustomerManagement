const db = require('../client');

async function trackIntent(businessId, intent, success) {
  if (!db.isDbEnabled()) return;
  await db.query(
    `INSERT INTO analytics (business_id, intent, success)
     VALUES ($1, $2, $3)`,
    [businessId, intent || null, Boolean(success)]
  );
}

async function getIntentSummary(businessId, limit = 10) {
  if (!db.isDbEnabled()) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
  const { rows } = await db.query(
    `SELECT intent, COUNT(*)::int AS count
     FROM analytics
     WHERE business_id = $1
     GROUP BY intent
     ORDER BY count DESC
     LIMIT $2`,
    [businessId, safeLimit]
  );
  return rows;
}

async function getConversionRate(businessId) {
  if (!db.isDbEnabled()) return 0;
  const { rows } = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN success THEN 1 ELSE 0 END), 0)::float AS success_count,
       COUNT(*)::float AS total_count
     FROM analytics
     WHERE business_id = $1`,
    [businessId]
  );
  const success = Number(rows[0]?.success_count || 0);
  const total = Number(rows[0]?.total_count || 0);
  if (!total) return 0;
  return success / total;
}

module.exports = {
  trackIntent,
  getIntentSummary,
  getConversionRate,
};
