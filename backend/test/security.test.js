const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  hashPassword,
  verifyPassword,
  validPassword,
} = require('../lib/security');
test('salted scrypt hashes verify without retaining the password', async () => {
  const first = await hashPassword('correct-horse-battery');
  const second = await hashPassword('correct-horse-battery');
  assert.notEqual(first, second);
  assert.ok(!first.includes('correct-horse-battery'));
  assert.equal(await verifyPassword('correct-horse-battery', first), true);
  assert.equal(await verifyPassword('wrong', first), false);
  assert.equal(await verifyPassword('anything', 'malformed'), false);
});
test('password bounds reject invalid types and excessive input', () => {
  for (const value of [null, {}, 123, 'short', 'a'.repeat(129)])
    assert.equal(validPassword(value), false);
  assert.equal(validPassword('a'.repeat(10)), true);
});
test('production refuses to start without a strong session secret', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(
    process.execPath,
    [require('node:path').join(__dirname, '../index.js')],
    {
      env: { ...process.env, NODE_ENV: 'production', SESSION_SECRET: '' },
      encoding: 'utf8',
      timeout: 5000,
    }
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SESSION_SECRET/);
});
