const config = require('./config');
const { createPool, waitForDb, initSchema } = require('./db');
const { createApp } = require('./app');

async function main() {
  const pool = createPool();
  const app = createApp({ pool });

  app.listen(config.port, () => console.log(`BE listening on ${config.port}`));

  await waitForDb(pool);
  await initSchema(pool);
  console.log('DB schema ready');
}

main().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
