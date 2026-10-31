const { test, expect } = require('@playwright/test');
const { randomUUID } = require('node:crypto');
const { createApp } = require('../../app');
const { connectDatabase } = require('../../lib/database');
const { items } = require('../../createdb');
let client, db, server, base;
test.beforeAll(async () => {
  const uri = new URL(
    process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017'
  );
  uri.pathname = `/fightshop_browser_${randomUUID().replaceAll('-', '')}`;
  ({ client, db } = await connectDatabase(uri.toString()));
  await db.collection('items').insertMany(items.map((item) => ({ ...item })));
  const app = createApp({
    db,
    sessionSecret: 'isolated-browser-test-secret-32-characters',
  });
  server = await new Promise((resolve) => {
    const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
  });
  base = `http://127.0.0.1:${server.address().port}`;
});
test.afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (db) await db.dropDatabase();
  if (client) await client.close();
});
test('register, filter, manage cart, order and log out on desktop and mobile', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // External product images are not a prerequisite; test the local fallback deterministically.
  await page.route('https://**/*', (route) => route.abort());
  await page.goto(base);
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'A következő menet'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.getByRole('link', { name: 'Regisztráció', exact: true }).click();
  const username = 'browser-' + randomUUID().slice(0, 8);
  await page.getByLabel('Felhasználónév', { exact: true }).fill(username);
  await page
    .getByLabel('E-mail-cím', { exact: true })
    .fill(username + '@example.invalid');
  await page
    .getByLabel('Jelszó', { exact: true })
    .fill('browser-test-password');
  await page.getByRole('button', { name: 'Regisztráció' }).click();
  await expect(page).toHaveURL(base + '/webshop.html');
  await expect(page.locator('.product-card')).toHaveCount(14);
  await expect(page.locator('#admin-panel')).toBeHidden();
  await page
    .getByRole('combobox', { name: 'Sportág', exact: true })
    .selectOption('Box');
  await expect(page.locator('.product-card')).toHaveCount(4);
  await page.getByLabel('Mit keresel?').fill('Everlast');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-image img')).toHaveAttribute(
    'src',
    '/placeholder.svg'
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Everlast Edző Kesztyű kosárba helyezése' })
    .click();
  await expect(page.locator('#cart-count')).toHaveText('1');
  await page.getByRole('link', { name: /Kosár/ }).click();
  await page.getByLabel('Darab', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Frissítés' }).click();
  await expect(page.locator('#cart-count')).toHaveText('2');
  await expect(page.locator('#total-cost')).toContainText('49');
  await page.getByLabel('Teljes név', { exact: true }).fill('Böngésző Teszt');
  await page
    .getByLabel('Teljes szállítási cím')
    .fill('1111 Budapest, Teszt utca 1.');
  await page.getByRole('button', { name: 'Bemutató rendelés leadása' }).click();
  await expect(page.locator('.order')).toHaveCount(1);
  await expect(page.locator('#cart-items')).toContainText('A kosarad még üres');
  await expect(page.locator('#order-submit')).toBeDisabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await page.reload();
  await expect(page.locator('.order')).toHaveCount(1);
  await page.getByRole('button', { name: 'Kijelentkezés' }).click();
  await expect(page).toHaveURL(base + '/');
  await page.goto(base + '/cart.html');
  await expect(page).toHaveURL(base + '/login.html?next=%2Fcart.html');
  await page.getByLabel('Felhasználónév', { exact: true }).fill(username);
  await page.getByLabel('Jelszó', { exact: true }).fill('wrong-password');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page.getByRole('alert')).toContainText('Hibás felhasználónév');
  await page
    .getByLabel('Jelszó', { exact: true })
    .fill('browser-test-password');
  await page.getByRole('button', { name: 'Bejelentkezés' }).click();
  await expect(page).toHaveURL(base + '/cart.html');
  await expect(page.locator('.order')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('guests can browse; product text is safe and login returns to the chosen category', async ({
  page,
}) => {
  await page.route('https://**/*', (route) => route.abort());
  const name = '<img src=x onerror=alert(1)>';
  const result = await db.collection('items').insertOne({
    termek_nev: name,
    leiras: 'Biztonságos szöveges megjelenítés tesztje.',
    ar: 1000,
    img: 'https://example.invalid/item.png',
    kategoria: 'MMA',
  });
  try {
    await page.goto(base + '/webshop.html?category=MMA');
    await expect(page.locator('#category')).toHaveValue('MMA');
    await page.getByLabel('Mit keresel?').fill(name);
    await expect(page.locator('.product-card h3')).toHaveText(name);
    await expect(page.locator('.product-card img')).toHaveCount(1);
    await page.locator('.product-card button').click();
    await expect(page).toHaveURL(
      base + '/login.html?next=%2Fwebshop.html%3Fcategory%3DMMA'
    );
    await page
      .locator('.form-card')
      .getByRole('link', { name: 'Regisztrálj itt.' })
      .click();
    const username = 'guest-' + randomUUID().slice(0, 8);
    await page.getByLabel('Felhasználónév', { exact: true }).fill(username);
    await page
      .getByLabel('E-mail-cím', { exact: true })
      .fill(username + '@example.invalid');
    await page
      .getByLabel('Jelszó', { exact: true })
      .fill('guest-test-password');
    await page.getByRole('button', { name: 'Regisztráció' }).click();
    await expect(page).toHaveURL(base + '/webshop.html?category=MMA');
    await expect(page.locator('#category')).toHaveValue('MMA');
  } finally {
    await db.collection('items').deleteOne({ _id: result.insertedId });
  }
});
