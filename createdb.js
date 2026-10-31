const { connectDatabase } = require('./lib/database');

const items = require('./data/products.json');

async function seed() {
  const { client, db } = await connectDatabase();
  try {
    for (const item of items) {
      // Stable sample IDs make repeated seeding safe without overwriting product edits.
      await db
        .collection('items')
        .updateOne(
          { id: item.id },
          { $setOnInsert: { ...item, seedId: item.id } },
          { upsert: true }
        );
    }
    console.log(
      `Seed complete: ${items.length} sample products available; existing products preserved.`
    );
  } finally {
    await client.close();
  }
}
if (require.main === module)
  seed().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
module.exports = { items, seed };
