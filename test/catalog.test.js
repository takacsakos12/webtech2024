const { test } = require('node:test');
const assert = require('node:assert/strict');
const products = require('../data/products.json');
test('catalog has 30 distinct products covering all six sports', () => {
  assert.equal(products.length, 30);
  assert.equal(
    new Set(products.map((product) => product.id)).size,
    products.length
  );
  assert.equal(
    new Set(products.map((product) => product.termek_nev)).size,
    products.length
  );
  assert.deepEqual(
    [...new Set(products.map((product) => product.kategoria))].sort(),
    ['Box', 'Judo', 'Karate', 'MMA', 'Muay Thai', 'Taekwondo']
  );
  for (const product of products) {
    assert.ok(Number.isSafeInteger(product.ar) && product.ar > 0);
    assert.ok(product.leiras.length >= 5);
    assert.ok(Array.isArray(product.sizes));
    assert.ok(Array.isArray(product.colors));
  }
});
test('unverified product photography is not advertised as freely licensed', () => {
  for (const product of products) {
    assert.equal(product.img, null);
    assert.equal(product.imageStatus, 'pending_license_verification');
  }
});
