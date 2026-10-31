const { connectDatabase } = require('../lib/database');
const { hashPassword } = require('../lib/security');
(async () => {
  const { client, db } = await connectDatabase();
  try {
    const users = await db.collection('users').find({}).toArray();
    const names = new Set(),
      emails = new Set();
    for (const user of users) {
      if (typeof user.username !== 'string' || typeof user.email !== 'string')
        throw new Error(
          'Invalid legacy account. Resolve its username/email before migration.'
        );
      const name = user.username.trim().toLocaleLowerCase('hu'),
        email = user.email.trim().toLowerCase();
      if (names.has(name) || emails.has(email))
        throw new Error(
          'Duplicate legacy identity detected. Resolve duplicates before migration; nothing has been changed.'
        );
      names.add(name);
      emails.add(email);
    }
    let count = 0;
    for (const user of users) {
      if (
        user.passwordHash &&
        user.usernameKey &&
        user.emailKey &&
        !Object.hasOwn(user, 'password')
      )
        continue;
      const changes = {
        usernameKey: user.username.trim().toLocaleLowerCase('hu'),
        emailKey: user.email.trim().toLowerCase(),
        role: user.role === 'admin' ? 'admin' : 'customer',
      };
      if (!user.passwordHash) {
        if (typeof user.password !== 'string')
          throw new Error(
            'Legacy user has no usable password. Restore/reset this account before migration.'
          );
        changes.passwordHash = await hashPassword(user.password);
      }
      if (!Number.isInteger(user.cartVersion)) {
        changes.legacyCart = user.cart || [];
        changes.cart = [];
        changes.cartVersion = 0;
        changes.orders = user.orders || [];
      }
      await db
        .collection('users')
        .updateOne(
          { _id: user._id },
          { $set: changes, $unset: { password: '' } }
        );
      count++;
    }
    console.log(
      `Migrated ${count} accounts. Legacy cart data retained as legacyCart.`
    );
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
