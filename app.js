const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { ObjectId } = require('mongodb');
const { randomBytes, randomUUID } = require('node:crypto');
const path = require('node:path');
const {
  hashPassword,
  verifyPassword,
  validPassword,
} = require('./lib/security');

const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const fail = (status, message) => Object.assign(new Error(message), { status });
const text = (value, min, max) =>
  typeof value === 'string' &&
  value.trim().length >= min &&
  value.trim().length <= max;
const objectId = (value) =>
  typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const publicUser = (user) => ({
  id: String(user._id),
  username: user.username,
  role: user.role === 'admin' ? 'admin' : 'customer',
});
const safeImage = (value) => {
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

function createApp({
  db,
  sessionStore,
  sessionSecret,
  production = false,
  trustProxy = false,
  apiOnly = false,
}) {
  if (!db || !sessionSecret)
    throw new Error('Database and session secret are required');
  const app = express();
  app.disable('x-powered-by');
  if (trustProxy) app.set('trust proxy', 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          'img-src': ["'self'", 'https:', 'data:'],
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'upgrade-insecure-requests': production ? [] : null,
        },
      },
      strictTransportSecurity: production ? undefined : false,
    })
  );
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));
  app.use((req, _res, next) => {
    if (
      req.body != null &&
      (typeof req.body !== 'object' || Array.isArray(req.body))
    )
      return next(fail(400, 'Érvénytelen kérés.'));
    req.body ||= {};
    next();
  });
  app.use(
    session({
      name: 'fightshop.sid',
      secret: sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: production,
        maxAge: 8 * 60 * 60 * 1000,
      },
    })
  );
  const csrf = (req) =>
    (req.session.csrfToken ||= randomBytes(32).toString('hex'));
  const csrfCookie = (req, res) =>
    res.cookie('XSRF-TOKEN', csrf(req), {
      httpOnly: false,
      secure: production,
      sameSite: 'lax',
      path: '/',
    });
  app.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    res.set('Cache-Control', 'no-store');
    if (
      !req.session.csrfToken ||
      (req.get('X-CSRF-Token') || req.get('X-XSRF-TOKEN')) !==
        req.session.csrfToken
    )
      return next(fail(403, 'A munkamenet lejárt. Frissítsd az oldalt.'));
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const auth = asyncRoute(async (req, _res, next) => {
    if (!objectId(req.session.userId))
      throw fail(401, 'A folytatáshoz jelentkezz be.');
    req.user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(req.session.userId) });
    if (!req.user) throw fail(401, 'A folytatáshoz jelentkezz be.');
    next();
  });
  const admin = (req, _res, next) =>
    next(
      req.user.role === 'admin'
        ? undefined
        : fail(403, 'Ehhez adminisztrátori jogosultság szükséges.')
    );
  const loginLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) =>
      res
        .status(429)
        .json({ message: 'Túl sok próbálkozás. Próbáld újra később.' }),
  });
  const authenticate = async (req, user) => {
    await new Promise((resolve, reject) =>
      req.session.regenerate((err) => (err ? reject(err) : resolve()))
    );
    req.session.userId = String(user._id);
    csrf(req);
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );
  };
  app.get(
    '/health',
    asyncRoute(async (_req, res) => {
      await db.command({ ping: 1 });
      res.json({ status: 'ok' });
    })
  );
  app.get(
    ['/api/session', '/api/auth/session'],
    asyncRoute(async (req, res) => {
      const user = objectId(req.session.userId)
        ? await db
            .collection('users')
            .findOne({ _id: new ObjectId(req.session.userId) })
        : null;
      csrfCookie(req, res);
      res.json({ user: user ? publicUser(user) : null, csrfToken: csrf(req) });
    })
  );
  const register = asyncRoute(async (req, res) => {
    const { username, email, password } = req.body;
    if (!text(username, 3, 40) || !/^[\p{L}\p{N}_.-]+$/u.test(username.trim()))
      throw fail(
        400,
        'A felhasználónév 3–40 betű, szám, pont, kötőjel vagy aláhúzás lehet.'
      );
    if (
      !text(email, 3, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      throw fail(400, 'Adj meg érvényes e-mail-címet.');
    if (!validPassword(password))
      throw fail(400, 'A jelszó 10–128 karakter hosszú legyen.');
    const usernameKey = username.trim().toLocaleLowerCase('hu');
    const emailKey = email.trim().toLowerCase();
    // Legacy users have no normalized keys: prevent claiming their identities, too.
    const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const existing = await db.collection('users').findOne({
      $or: [
        { usernameKey },
        { emailKey },
        {
          username: {
            $regex: `^${escaped(username.trim())}$`,
            $options: 'i',
          },
        },
        { email: { $regex: `^${escaped(email.trim())}$`, $options: 'i' } },
      ],
    });
    if (existing)
      throw fail(409, 'Ez a felhasználónév vagy e-mail-cím már foglalt.');
    const user = {
      username: username.trim(),
      usernameKey,
      email: email.trim(),
      emailKey,
      passwordHash: await hashPassword(password),
      role: 'customer',
      cart: [],
      cartVersion: 0,
      orders: [],
      createdAt: new Date(),
    };
    const result = await db.collection('users').insertOne(user);
    user._id = result.insertedId;
    await authenticate(req, user);
    csrfCookie(req, res);
    res.status(201).json({ user: publicUser(user), csrfToken: csrf(req) });
  });
  const login = asyncRoute(async (req, res) => {
    const { username, password } = req.body;
    if (
      !text(username, 1, 40) ||
      typeof password !== 'string' ||
      password.length > 128
    )
      throw fail(400, 'Add meg a felhasználónevet és a jelszót.');
    const user = await db
      .collection('users')
      .findOne({ usernameKey: username.trim().toLocaleLowerCase('hu') });
    // Always perform the expensive password check, including unknown users.
    const dummy = 'scrypt:' + '0'.repeat(32) + ':' + '0'.repeat(128);
    if (!(await verifyPassword(password, user?.passwordHash || dummy)) || !user)
      throw fail(401, 'Hibás felhasználónév vagy jelszó.');
    await authenticate(req, user);
    csrfCookie(req, res);
    res.json({ user: publicUser(user), csrfToken: csrf(req) });
  });
  app.post(
    ['/register', '/api/users/register', '/api/auth/register'],
    loginLimit,
    register
  );
  app.post(
    ['/login', '/api/users/login', '/api/auth/login'],
    loginLimit,
    login
  );
  app.post(
    ['/api/logout', '/api/auth/logout'],
    asyncRoute(async (req, res) => {
      await new Promise((resolve, reject) =>
        req.session.destroy((err) => (err ? reject(err) : resolve()))
      );
      res.clearCookie('fightshop.sid');
      res.clearCookie('XSRF-TOKEN', {
        path: '/',
        sameSite: 'lax',
        secure: production,
      });
      res.json({ message: 'Sikeresen kijelentkeztél.' });
    })
  );
  app.get('/api/users/me', auth, (req, res) => res.json(publicUser(req.user)));
  app.get(
    '/api/items',
    asyncRoute(async (_req, res) => {
      res.json(
        await db
          .collection('items')
          .find({}, { projection: { seedId: 0 } })
          .sort({ id: 1, _id: 1 })
          .toArray()
      );
    })
  );
  app.post(
    ['/api/items', '/api/items/add'],
    auth,
    admin,
    asyncRoute(async (req, res) => {
      const { termek_nev, leiras, ar, img, kategoria, gyarto } = req.body;
      if (
        !text(termek_nev, 2, 120) ||
        !text(leiras, 5, 2000) ||
        !Number.isSafeInteger(ar) ||
        ar < 1 ||
        ar > 10000000 ||
        !safeImage(img)
      )
        throw fail(
          400,
          'Ellenőrizd a nevet, leírást, pozitív egész árat és HTTPS-képcímet.'
        );
      if (
        (kategoria != null && !text(kategoria, 1, 60)) ||
        (gyarto != null && !text(gyarto, 1, 60))
      )
        throw fail(400, 'Érvénytelen kategória vagy gyártó.');
      const item = {
        termek_nev: termek_nev.trim(),
        leiras: leiras.trim(),
        ar,
        img,
        kategoria: kategoria?.trim() || 'Egyéb',
        gyarto: gyarto?.trim() || '',
      };
      const result = await db.collection('items').insertOne(item);
      res.status(201).json({ ...item, _id: result.insertedId });
    })
  );
  app.get(
    '/api/items/:itemId',
    asyncRoute(async (req, res) => {
      if (!objectId(req.params.itemId))
        throw fail(400, 'Érvénytelen termékazonosító.');
      const item = await db
        .collection('items')
        .findOne(
          { _id: new ObjectId(req.params.itemId) },
          { projection: { seedId: 0 } }
        );
      if (!item) throw fail(404, 'A termék nem található.');
      res.json(item);
    })
  );
  const cartDetails = async (user) => {
    const cart = (user.cart || []).filter((entry) => objectId(entry.itemId));
    const products = await db
      .collection('items')
      .find({ _id: { $in: cart.map((entry) => new ObjectId(entry.itemId)) } })
      .toArray();
    const items = cart.map((entry) => {
      const item = products.find(
        (product) => String(product._id) === entry.itemId
      );
      if (!item)
        throw fail(
          409,
          'Egy kosárban lévő termék már nem elérhető. Távolítsd el a kosárból.'
        );
      return {
        ...item,
        quantity: entry.quantity,
        subtotal: item.ar * entry.quantity,
      };
    });
    return {
      items,
      total: items.reduce((sum, item) => sum + item.subtotal, 0),
    };
  };
  app.get(
    '/api/cart',
    auth,
    asyncRoute(async (req, res) => res.json(await cartDetails(req.user)))
  );
  const saveCart = async (user, cart) => {
    const result = await db
      .collection('users')
      .updateOne(
        { _id: user._id, cartVersion: user.cartVersion ?? { $exists: false } },
        { $set: { cart }, $inc: { cartVersion: 1 } }
      );
    if (!result.matchedCount)
      throw fail(
        409,
        'A kosár közben megváltozott. Frissítsd az oldalt, és próbáld újra.'
      );
  };
  app.post(
    '/api/cart/add',
    auth,
    asyncRoute(async (req, res) => {
      const { quantity = 1 } = req.body;
      const itemId =
        typeof req.body.itemId === 'string'
          ? req.body.itemId.toLowerCase()
          : req.body.itemId;
      if (
        !objectId(itemId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      )
        throw fail(400, 'Érvénytelen termék vagy mennyiség.');
      if (
        !(await db.collection('items').findOne({ _id: new ObjectId(itemId) }))
      )
        throw fail(404, 'A termék nem található.');
      const cart = req.user.cart || [];
      const entry = cart.find((entry) => entry.itemId === itemId);
      if (entry) {
        if (entry.quantity + quantity > 99)
          throw fail(400, 'Legfeljebb 99 darab tehető a kosárba.');
        entry.quantity += quantity;
      } else {
        if (cart.length >= 100) throw fail(400, 'A kosár megtelt.');
        cart.push({ itemId, quantity });
      }
      await saveCart(req.user, cart);
      res.status(201).json(await cartDetails({ cart }));
    })
  );
  app.patch(
    '/api/cart/:itemId',
    auth,
    asyncRoute(async (req, res) => {
      const { quantity } = req.body;
      if (
        !objectId(req.params.itemId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      )
        throw fail(400, 'A mennyiség 1–99 közötti egész szám legyen.');
      const cart = req.user.cart || [];
      const entry = cart.find(
        (entry) => entry.itemId === req.params.itemId.toLowerCase()
      );
      if (!entry) throw fail(404, 'A termék nincs a kosárban.');
      entry.quantity = quantity;
      await saveCart(req.user, cart);
      res.json(await cartDetails({ cart }));
    })
  );
  app.delete(
    '/api/cart/remove/:itemId',
    auth,
    asyncRoute(async (req, res) => {
      if (!objectId(req.params.itemId))
        throw fail(400, 'Érvénytelen termékazonosító.');
      const cart = (req.user.cart || []).filter(
        (entry) => entry.itemId !== req.params.itemId.toLowerCase()
      );
      await saveCart(req.user, cart);
      res.json(await cartDetails({ cart }));
    })
  );
  app.get('/api/orders', auth, (req, res) =>
    res.json((req.user.orders || []).slice().reverse())
  );
  app.get('/api/orders/:orderId', auth, (req, res, next) => {
    const order = (req.user.orders || []).find(
      (order) => order.id === req.params.orderId
    );
    if (!order) return next(fail(404, 'A rendelés nem található.'));
    res.json(order);
  });
  app.post(
    '/api/orders',
    auth,
    asyncRoute(async (req, res) => {
      const { name, address, paymentMethod } = req.body;
      if (
        !text(name, 3, 120) ||
        !text(address, 10, 300) ||
        paymentMethod !== 'cash_on_delivery'
      )
        throw fail(
          400,
          'Add meg a nevet, a teljes szállítási címet és az utánvétes fizetést.'
        );
      const { items, total } = await cartDetails(req.user);
      if (!items.length) throw fail(400, 'A kosarad üres.');
      if ((req.user.orders || []).length >= 100)
        throw fail(409, 'Elérted a bemutatóban tárolható rendelések számát.');
      const order = {
        id: randomUUID(),
        createdAt: new Date(),
        name: name.trim(),
        address: address.trim(),
        paymentMethod,
        status: 'received',
        items: items.map((item) => ({
          itemId: String(item._id),
          termek_nev: item.termek_nev,
          ar: item.ar,
          quantity: item.quantity,
        })),
        total,
      };
      // A single atomic document update commits the order and empties exactly this cart version.
      const result = await db.collection('users').updateOne(
        { _id: req.user._id, cartVersion: req.user.cartVersion },
        {
          $push: { orders: order },
          $set: { cart: [] },
          $inc: { cartVersion: 1 },
        }
      );
      if (!result.matchedCount)
        throw fail(
          409,
          'A kosár közben megváltozott. Ellenőrizd a rendeléseidet.'
        );
      res.status(201).json(order);
    })
  );
  app.use('/api', (_req, _res, next) =>
    next(fail(404, 'Ez a végpont nem található.'))
  );
  if (!apiOnly) {
    app.get(['/cart.html'], (req, res, next) =>
      req.session.userId
        ? next()
        : res.redirect(
            '/login.html?next=' + encodeURIComponent(req.originalUrl)
          )
    );
    app.get('/login', (_req, res) =>
      res.redirect('/login.html?next=' + encodeURIComponent(req.originalUrl))
    );
    app.get('/register', (_req, res) => res.redirect('/register.html'));
    app.use(
      express.static(path.join(__dirname, 'public'), { index: 'index.html' })
    );
  }
  app.use((_req, _res, next) => next(fail(404, 'Az oldal nem található.')));
  app.use((err, _req, res, _next) => {
    const status = err.code === 11000 ? 409 : err.status || 500;
    if (err.type === 'entity.parse.failed')
      err.message = 'Érvénytelen JSON-kérés.';
    if (err.type === 'entity.too.large') err.message = 'A kérés túl nagy.';
    if (status >= 500) console.error('Request failed:', err.message);
    res.status(status).json({
      message:
        err.code === 11000
          ? 'Ez a felhasználónév vagy e-mail-cím már foglalt.'
          : status >= 500
            ? 'Átmeneti szerverhiba. Próbáld újra később.'
            : err.message,
    });
  });
  return app;
}
module.exports = { createApp };
