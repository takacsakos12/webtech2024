const { randomBytes, scrypt: derive, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const scrypt = promisify(derive);
const validPassword = (value) =>
  typeof value === 'string' && value.length >= 10 && value.length <= 128;
async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
async function verifyPassword(password, hash) {
  if (
    typeof hash !== 'string' ||
    !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash)
  )
    return false;
  const [, salt, key] = hash.split(':');
  const actual = await scrypt(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(key, 'hex'));
}
module.exports = { hashPassword, verifyPassword, validPassword };
