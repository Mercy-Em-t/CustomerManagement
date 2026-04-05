const fs = require('fs').promises;
const path = require('path');
const db = require('./client');

async function run() {
  if (!db.isDbEnabled()) {
    throw new Error('DATABASE_URL is required to run migrations');
  }

  const migrationsDir = path.resolve(__dirname, '../../migrations');
  const files = (await fs.readdir(migrationsDir))
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    // eslint-disable-next-line no-console
    console.log(`Applying migration: ${file}`);
    await db.query(sql);
  }

  // eslint-disable-next-line no-console
  console.log('Migrations complete');
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err.message);
  process.exit(1);
});
