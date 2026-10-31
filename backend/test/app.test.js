const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ObjectId } = require('mongodb');
const { connectDatabase } = require('../lib/database');
const { createApp } = require('../app');
const { items } = require('../createdb');
let client, db, server, base, product;
function browser() {
  let cookie = '',
    token;
  return {
    get cookie() {
      return cookie;
    },
    async request(path, { method = 'GET', body, csrf = true } = {}) {
      const headers = {};
      if (cookie) headers.Cookie = cookie;
      if (body !== undefined) headers['Content-Type'] = 'application/json';
      if (csrf && token) headers['X-CSRF-Token'] = token;
      const response = await fetch(base + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'manual',
      });
      const setCookie = response.headers
        .getSetCookie()
        .find((cookie) => cookie.startsWith('fightshop.sid='));
      if (setCookie) cookie = setCookie.split(';')[0];
      const data = response.headers
        .get('content-type')
        ?.includes('application/json')
        ? await response.json()
        : await response.text();
      if (data.csrfToken) token = data.csrfToken;
      return { status: response.status, data, headers: response.headers };
    },
    async register(name) {
      await this.request('/api/session');
      return this.request('/register', {
        method: 'POST',
        body: {
          username: name,
          email: `${name}@example.invalid`,
          password: 'strong-test-password',
        },
      });
    },
  };
}
before(async () => {
  const uri = new URL(
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = `/fightshop_test_${randomUUID().replaceAll('-', '')}`;
  ({ client, db } = await connectDatabase(uri.toString()));
  const result = await db.collection('items').insertOne({ ...items[0] });
  product = String(result.insertedId);
  const app = createApp({
    db,
    sessionSecret: 'integration-test-secret-with-at-least-32-characters',
  });
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.dropDatabase();
  if (client) await client.close();
});

test('health checks database; pages have security headers and private pages redirect', async () => {
  const b = browser();
  assert.equal((await b.request('/health')).data.status, 'ok');
  const home = await b.request('/');
  assert.equal(home.status, 200);
  assert.ok(
    home.headers.get('content-security-policy').includes("script-src 'self'")
  );
  assert.equal(home.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(home.headers.get('x-powered-by'), null);
  for (const page of ['/cart.html']) {
    const r = await b.request(page);
    assert.equal(r.status, 302);
    assert.equal(r.headers.get('location'), '/login.html?next=%2Fcart.html');
  }
  assert.equal((await b.request('/webshop.html')).status, 200);
  assert.equal((await b.request('/api/users')).status, 404);
});
test('CSRF protection applies before registration and rejects missing token', async () => {
  const b = browser();
  await b.request('/api/session');
  assert.equal(
    (await b.request('/register', { method: 'POST', csrf: false, body: {} }))
      .status,
    403
  );
});
test('registration hashes passwords, rotates sessions, and never exposes credentials', async () => {
  const b = browser();
  await b.request('/api/session');
  const oldCookie = b.cookie;
  const r = await b.register('fighter');
  assert.equal(r.status, 201);
  assert.notEqual(b.cookie, oldCookie);
  assert.deepEqual(Object.keys(r.data.user).sort(), ['id', 'role', 'username']);
  assert.equal(r.data.user.role, 'customer');
  const user = await db.collection('users').findOne({ username: 'fighter' });
  assert.match(user.passwordHash, /^scrypt:/);
  assert.equal(user.password, undefined);
  assert.equal((await b.request('/api/users/me')).data.username, 'fighter');
  assert.equal((await b.request('/webshop.html')).status, 200);
});
test('normalized duplicate identities, weak passwords and NoSQL injection are rejected', async () => {
  const b = browser();
  await b.request('/api/session');
  assert.equal((await b.register('FIGHTER')).status, 409);
  assert.equal(
    (
      await b.request('/register', {
        method: 'POST',
        body: {
          username: 'weak',
          email: 'weak@example.invalid',
          password: '123',
        },
      })
    ).status,
    400
  );
  assert.equal(
    (
      await b.request('/login', {
        method: 'POST',
        body: { username: { $ne: null }, password: { $ne: null } },
      })
    ).status,
    400
  );
});
test('login rejects wrong credentials and logout invalidates the session', async () => {
  const b = browser();
  await b.request('/api/session');
  assert.equal(
    (
      await b.request('/login', {
        method: 'POST',
        body: { username: 'fighter', password: 'wrong' },
      })
    ).status,
    401
  );
  const r = await b.request('/login', {
    method: 'POST',
    body: { username: 'FIGHTER', password: 'strong-test-password' },
  });
  assert.equal(r.status, 200);
  assert.match(r.headers.get('set-cookie'), /HttpOnly/);
  assert.match(r.headers.get('set-cookie'), /SameSite=Lax/);
  assert.equal(
    (await b.request('/api/logout', { method: 'POST' })).status,
    200
  );
  assert.equal((await b.request('/api/cart')).status, 401);
});
test('carts require authentication, ignore supplied ownership, preserve catalog, and validate IDs', async () => {
  const anonymous = browser();
  assert.equal((await anonymous.request('/api/cart')).status, 401);
  const first = browser(),
    second = browser();
  await first.register('cartone');
  await second.register('carttwo');
  let r = await first.request('/api/cart/add', {
    method: 'POST',
    body: { itemId: product, userId: 'carttwo', quantity: 2 },
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.total, items[0].ar * 2);
  assert.equal((await second.request('/api/cart')).data.items.length, 0);
  assert.equal((await first.request('/api/items')).data.length, 1);
  r = await first.request('/api/cart/add', {
    method: 'POST',
    body: { itemId: product },
  });
  assert.equal(r.data.items[0].quantity, 3);
  r = await first.request(`/api/cart/${product}`, {
    method: 'PATCH',
    body: { quantity: 4 },
  });
  assert.equal(r.data.total, items[0].ar * 4);
  for (const value of [-1, 0, 100, 1.5, '2'])
    assert.equal(
      (
        await first.request(`/api/cart/${product}`, {
          method: 'PATCH',
          body: { quantity: value },
        })
      ).status,
      400
    );
  assert.equal(
    (
      await first.request('/api/cart/add', {
        method: 'POST',
        body: { itemId: 'bad-id' },
      })
    ).status,
    400
  );
  assert.equal(
    (
      await first.request('/api/cart/add', {
        method: 'POST',
        body: { itemId: String(new ObjectId()) },
      })
    ).status,
    404
  );
  assert.equal((await first.request('/api/cart/carttwo')).status, 404);
  assert.equal(
    (await first.request(`/api/cart/remove/${product}`, { method: 'DELETE' }))
      .data.items.length,
    0
  );
  assert.equal((await first.request('/api/items')).data.length, 1);
});
test('only administrators can create products; invalid prices and image protocols fail', async () => {
  const b = browser();
  await b.register('admincheck');
  const body = {
    termek_nev: 'Teszt kesztyű',
    leiras: 'Teszt termék leírása',
    ar: 2000,
    img: 'https://example.invalid/glove.png',
  };
  assert.equal(
    (await b.request('/api/items/add', { method: 'POST', body })).status,
    403
  );
  await db
    .collection('users')
    .updateOne({ username: 'admincheck' }, { $set: { role: 'admin' } });
  for (const ar of [0, -1, '100', 1.5])
    assert.equal(
      (
        await b.request('/api/items/add', {
          method: 'POST',
          body: { ...body, ar },
        })
      ).status,
      400
    );
  assert.equal(
    (
      await b.request('/api/items/add', {
        method: 'POST',
        body: { ...body, img: 'javascript:alert(1)' },
      })
    ).status,
    400
  );
  assert.equal(
    (await b.request('/api/items/add', { method: 'POST', body })).status,
    201
  );
});
test('checkout uses server prices, atomically clears the cart, prevents double submission and isolates history', async () => {
  const b = browser(),
    other = browser();
  await b.register('orderone');
  await other.register('ordertwo');
  const order = {
    name: 'Teszt Elek',
    address: '1111 Budapest, Teszt utca 1.',
    paymentMethod: 'cash_on_delivery',
    total: 1,
  };
  assert.equal(
    (await b.request('/api/orders', { method: 'POST', body: order })).status,
    400
  );
  await b.request('/api/cart/add', {
    method: 'POST',
    body: { itemId: product, quantity: 2 },
  });
  assert.equal(
    (
      await b.request('/api/orders', {
        method: 'POST',
        body: { ...order, paymentMethod: 'prepayment' },
      })
    ).status,
    400
  );
  const responses = await Promise.all([
    b.request('/api/orders', { method: 'POST', body: order }),
    b.request('/api/orders', { method: 'POST', body: order }),
  ]);
  assert.equal(responses.filter((r) => r.status === 201).length, 1);
  assert.ok(responses.some((r) => [400, 409].includes(r.status)));
  const result = responses.find((r) => r.status === 201).data;
  assert.equal(result.total, items[0].ar * 2);
  assert.equal((await b.request('/api/cart')).data.items.length, 0);
  assert.equal((await b.request('/api/orders')).data.length, 1);
  assert.equal((await other.request('/api/orders')).data.length, 0);
  assert.ok(
    await db.collection('items').findOne({ _id: new ObjectId(product) })
  );
});
test('malformed JSON and oversized requests return errors without leaking internals', async () => {
  let r = await fetch(base + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{bad json',
  });
  assert.equal(r.status, 400);
  r = await fetch(base + '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: 'x'.repeat(20000) }),
  });
  assert.equal(r.status, 413);
});
test('seed is idempotent and preserves local product edits', async () => {
  const { execFile } = require('node:child_process');
  const exec = require('node:util').promisify(execFile);
  const uri = new URL(
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = '/' + db.databaseName;
  await db.collection('items').updateOne({ id: 1 }, { $set: { ar: 12345 } });
  const options = { env: { ...process.env, MONGODB_URI: uri.toString() } };
  await exec(
    process.execPath,
    [require('node:path').join(__dirname, '../createdb.js')],
    options
  );
  const count = await db.collection('items').countDocuments();
  await exec(
    process.execPath,
    [require('node:path').join(__dirname, '../createdb.js')],
    options
  );
  assert.equal(await db.collection('items').countDocuments(), count);
  assert.equal((await db.collection('items').findOne({ id: 1 })).ar, 12345);
  assert.equal(
    await db
      .collection('items')
      .countDocuments({ id: { $gte: 1, $lte: items.length } }),
    items.length
  );
});
test('repeated authentication attempts are rate limited', async () => {
  const b = browser();
  await b.request('/api/session');
  let result;
  for (let attempt = 0; attempt < 21; attempt++) {
    result = await b.request('/login', {
      method: 'POST',
      body: { username: 'does-not-exist', password: 'wrong-password' },
    });
    if (result.status === 429) break;
    assert.equal(result.status, 401);
  }
  assert.equal(result.status, 429);
  assert.ok(result.headers.get('ratelimit'));
});
