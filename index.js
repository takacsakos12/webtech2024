const { randomBytes } = require('node:crypto');
const MongoStore = require('connect-mongo');
const { createApp } = require('./app');
const { connectDatabase } = require('./lib/database');

async function main() {
  const production = process.env.NODE_ENV === 'production';
  if (
    production &&
    (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32)
  )
    throw new Error(
      'Production requires SESSION_SECRET with at least 32 characters'
    );
  const { client, db } = await connectDatabase();
  const store = MongoStore.create({
    clientPromise: Promise.resolve(client),
    dbName: db.databaseName,
    collectionName: 'sessions',
  });
  const app = createApp({
    db,
    sessionStore: store,
    sessionSecret:
      process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
    production,
    trustProxy: process.env.TRUST_PROXY === '1',
  });
  const server = app.listen(
    Number(process.env.PORT || 8080),
    process.env.HOST || '0.0.0.0',
    () => console.log(`Fight Shop listening on port ${server.address().port}`)
  );
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => {
      await client.close();
      clearTimeout(timeout);
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
  server.on('error', async (error) => {
    console.error(error.message);
    await client.close();
    process.exitCode = 1;
  });
}
main().catch((error) => {
  console.error('Startup failed:', error.message);
  process.exitCode = 1;
});
