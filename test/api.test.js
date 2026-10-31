const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ObjectId } = require('mongodb');
const { createApp } = require('../app');
const { connectDatabase } = require('../lib/database');
let client, db, server, base, itemId;
function angularClient() {
  const cookies = new Map();
  return {
    cookies,
    async request(
      path,
      method = 'GET',
      body,
      token = cookies.get('XSRF-TOKEN')
    ) {
      const headers = {
        Cookie: [...cookies]
          .map(([key, value]) => `${key}=${value}`)
          .join('; '),
      };
      if (body) headers['Content-Type'] = 'application/json';
      if (token) headers['X-XSRF-TOKEN'] = token;
      const response = await fetch(base + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
      });
      for (const cookie of response.headers.getSetCookie()) {
        const pair = cookie.split(';')[0];
        const split = pair.indexOf('=');
        cookies.set(pair.slice(0, split), pair.slice(split + 1));
      }
      return {
        status: response.status,
        headers: response.headers,
        data: await response.json(),
      };
    },
  };
}
before(async () => {
  const uri = new URL(
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = '/fightshop_api_' + randomUUID().replaceAll('-', '');
  ({ client, db } = await connectDatabase(uri.toString()));
  const inserted = await db.collection('items').insertOne({
    termek_nev: 'API kesztyű',
    ar: 10000,
    leiras: 'Teszt termék',
    img: 'https://example.invalid/image.png',
  });
  itemId = String(inserted.insertedId);
  const app = createApp({
    db,
    apiOnly: true,
    sessionSecret: 'api-integration-test-only-session-secret',
  });
  server = await new Promise((resolve) => {
    const running = app.listen(0, '127.0.0.1', () => resolve(running));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.dropDatabase();
  if (client) await client.close();
});
test('API-only mode returns JSON instead of serving or redirecting HTML', async () => {
  const b = angularClient();
  for (const path of [
    '/',
    '/login',
    '/register',
    '/cart.html',
    '/webshop.html',
    '/css/style.css',
  ]) {
    const r = await b.request(path);
    assert.equal(r.status, 404);
    assert.ok(r.data.message);
    assert.equal(r.headers.get('location'), null);
  }
  assert.equal((await b.request('/health')).status, 200);
  assert.equal((await b.request('/api/cart')).status, 401);
});
test('Angular cookie/header flow supports registration, cart, order details and logout', async () => {
  const b = angularClient();
  let r = await b.request('/api/auth/session');
  assert.equal(r.data.user, null);
  assert.equal(b.cookies.get('XSRF-TOKEN'), r.data.csrfToken);
  const csrfCookie = r.headers
    .getSetCookie()
    .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
  assert.ok(!csrfCookie.includes('HttpOnly'));
  assert.ok(csrfCookie.includes('SameSite=Lax'));
  const oldToken = b.cookies.get('XSRF-TOKEN');
  r = await b.request('/api/auth/register', 'POST', {
    username: 'angular-user',
    email: 'angular@example.invalid',
    password: 'angular-test-password',
  });
  assert.equal(r.status, 201);
  assert.notEqual(b.cookies.get('XSRF-TOKEN'), oldToken);
  assert.equal(
    (await b.request('/api/cart/add', 'POST', { itemId }, oldToken)).status,
    403
  );
  assert.equal(
    (await b.request('/api/cart/add', 'POST', { itemId, quantity: 2 })).status,
    201
  );
  r = await b.request('/api/orders', 'POST', {
    name: 'Teszt Elek',
    address: '1111 Budapest, Teszt utca 1.',
    paymentMethod: 'cash_on_delivery',
  });
  assert.equal(r.status, 201);
  const order = r.data;
  assert.equal((await b.request('/api/orders/' + order.id)).data.total, 20000);
  const other = angularClient();
  await other.request('/api/auth/session');
  await other.request('/api/auth/register', 'POST', {
    username: 'angular-other',
    email: 'other@example.invalid',
    password: 'angular-test-password',
  });
  assert.equal((await other.request('/api/orders/' + order.id)).status, 404);
  assert.equal((await b.request('/api/auth/logout', 'POST')).status, 200);
  assert.equal(b.cookies.get('XSRF-TOKEN'), '');
  assert.equal((await b.request('/api/cart')).status, 401);
  await b.request('/api/auth/session');
  assert.equal(
    (
      await b.request('/api/auth/login', 'POST', {
        username: 'angular-user',
        password: 'angular-test-password',
      })
    ).status,
    200
  );
});
test('product details distinguish invalid IDs and missing products', async () => {
  const b = angularClient();
  assert.equal(
    (await b.request('/api/items/' + itemId)).data.termek_nev,
    'API kesztyű'
  );
  assert.equal((await b.request('/api/items/invalid')).status, 400);
  assert.equal((await b.request('/api/items/' + new ObjectId())).status, 404);
});
test('an XSRF cookie alone cannot replace the server session token', async () => {
  const response = await fetch(base + '/api/auth/register', {
    method: 'POST',
    headers: {
      Cookie: 'XSRF-TOKEN=forged',
      'X-XSRF-TOKEN': 'forged',
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  assert.equal(response.status, 403);
});
