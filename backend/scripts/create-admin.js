const { connectDatabase } = require('../lib/database');
const { hashPassword, validPassword } = require('../lib/security');
(async () => {
  const {
    ADMIN_USERNAME: username,
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: password,
  } = process.env;
  if (
    !username ||
    !/^[\p{L}\p{N}_.-]{3,40}$/u.test(username) ||
    !email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !validPassword(password)
  )
    throw new Error(
      'Set valid ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD (10–128 characters) securely in the process environment.'
    );
  const { client, db } = await connectDatabase();
  try {
    const usernameKey = username.toLocaleLowerCase('hu');
    // Never silently promote or replace an existing account.
    if (
      await db.collection('users').findOne({
        $or: [
          { usernameKey },
          { username },
          { emailKey: email.toLowerCase() },
          { email },
        ],
      })
    )
      throw new Error(
        'Account already exists. Use a distinct administrator identity.'
      );
    await db.collection('users').insertOne({
      username,
      usernameKey,
      email,
      emailKey: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      role: 'admin',
      cart: [],
      cartVersion: 0,
      orders: [],
      createdAt: new Date(),
    });
    console.log('Administrator created.');
  } finally {
    await client.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
