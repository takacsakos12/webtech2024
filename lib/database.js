const { MongoClient } = require('mongodb');
async function connectDatabase(
  uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/store'
) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db();
  try {
    await db.collection('users').createIndexes([
      {
        key: { usernameKey: 1 },
        unique: true,
        partialFilterExpression: { usernameKey: { $type: 'string' } },
      },
      {
        key: { emailKey: 1 },
        unique: true,
        partialFilterExpression: { emailKey: { $type: 'string' } },
      },
    ]);
    await db
      .collection('items')
      .createIndex({ seedId: 1 }, { unique: true, sparse: true });
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}
module.exports = { connectDatabase };
