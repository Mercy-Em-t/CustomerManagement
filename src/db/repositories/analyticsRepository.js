const db = require('../client');

async function trackIntent(businessId, intent, success) {
  if (!db.isDbEnabled()) return;
  await db.query(
    `INSERT INTO analytics (business_id, intent, success)
     VALUES ($1, $2, $3)`,
    [businessId, intent || null, Boolean(success)]
  );
}

module.exports = {
  trackIntent,
};
