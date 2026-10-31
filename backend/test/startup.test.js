const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const { connectDatabase } = require('../lib/database');
const secret = 'test-only-persistent-session-secret-for-restart-check';
function start(env) {
  const child = spawn(
    process.execPath,
    [require('node:path').join(__dirname, '../index.js')],
    {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const ready = new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Startup timed out: ' + output));
    }, 10000);
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/listening on port (\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(`http://127.0.0.1:${match[1]}`);
      }
    });
    child.stderr.on('data', (chunk) => {
      output += chunk;
    });
    child.once('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Server exited (${code}): ${output}`));
    });
  });
  return { child, ready };
}
function stop(child) {
  if (child.exitCode !== null) return Promise.resolve();
  return new Promise((resolve) => {
    child.once('exit', resolve);
    child.kill('SIGTERM');
  });
}
test('real startup uses Mongo-backed sessions that survive a server restart', async () => {
  const uri = new URL(
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = '/fightshop_startup_' + randomUUID().replaceAll('-', '');
  const { client, db } = await connectDatabase(uri.toString());
  const env = {
    MONGODB_URI: uri.toString(),
    SESSION_SECRET: secret,
    PORT: '0',
    HOST: '127.0.0.1',
    NODE_ENV: 'development',
    TRUST_PROXY: '0',
  };
  let instance;
  try {
    instance = start(env);
    let base = await instance.ready;
    let response = await fetch(base + '/api/session');
    const cookie = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('fightshop.sid='))
      .split(';')[0];
    const { csrfToken } = await response.json();
    response = await fetch(base + '/register', {
      method: 'POST',
      headers: {
        Cookie: cookie,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        username: 'persistent',
        email: 'persistent@example.invalid',
        password: 'persistent-password',
      }),
    });
    assert.equal(response.status, 201);
    const authenticated = response.headers
      .getSetCookie()
      .find((cookie) => cookie.startsWith('fightshop.sid='))
      .split(';')[0];
    await response.json();
    assert.equal(await db.collection('sessions').countDocuments(), 1);
    await stop(instance.child);
    instance = start(env);
    base = await instance.ready;
    response = await fetch(base + '/api/users/me', {
      headers: { Cookie: authenticated },
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).username, 'persistent');
    assert.equal((await fetch(base + '/health')).status, 200);
  } finally {
    if (instance) await stop(instance.child);
    await db.dropDatabase();
    await client.close();
  }
});
