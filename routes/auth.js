const { randomBytes } = require('node:crypto');
const { ObjectId } = require('mongodb');
const { rateLimit } = require('express-rate-limit');
const {
  hashPassword,
  verifyPassword,
  validPassword,
} = require('../lib/security');
const {
  asyncHandler,
  httpError,
  isText,
  isObjectId,
  userProfile,
} = require('../lib/http');

function setupAuth(app, db, production) {
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
      return next(httpError(403, 'A munkamenet lejárt. Frissítsd az oldalt.'));
    next();
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const auth = asyncHandler(async (req, _res, next) => {
    if (!isObjectId(req.session.userId))
      throw httpError(401, 'A folytatáshoz jelentkezz be.');
    req.user = await db
      .collection('users')
      .findOne({ _id: new ObjectId(req.session.userId) });
    if (!req.user) throw httpError(401, 'A folytatáshoz jelentkezz be.');
    next();
  });
  function admin(req, _res, next) {
    if (req.user.role !== 'admin') {
      return next(
        httpError(403, 'Ehhez adminisztrátori jogosultság szükséges.')
      );
    }
    next();
  }
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
    ['/api/session', '/api/auth/session'],
    asyncHandler(async (req, res) => {
      const user = isObjectId(req.session.userId)
        ? await db
            .collection('users')
            .findOne({ _id: new ObjectId(req.session.userId) })
        : null;
      csrfCookie(req, res);
      res.json({ user: user ? userProfile(user) : null, csrfToken: csrf(req) });
    })
  );
  const register = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (
      !isText(username, 3, 40) ||
      !/^[\p{L}\p{N}_.-]+$/u.test(username.trim())
    )
      throw httpError(
        400,
        'A felhasználónév 3–40 betű, szám, pont, kötőjel vagy aláhúzás lehet.'
      );
    if (
      !isText(email, 3, 254) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    )
      throw httpError(400, 'Adj meg érvényes e-mail-címet.');
    if (!validPassword(password))
      throw httpError(400, 'A jelszó 10–128 karakter hosszú legyen.');
    const usernameKey = username.trim().toLocaleLowerCase('hu');
    const emailKey = email.trim().toLowerCase();
    const existing = await db
      .collection('users')
      .findOne({ $or: [{ usernameKey }, { emailKey }] });
    if (existing)
      throw httpError(409, 'Ez a felhasználónév vagy e-mail-cím már foglalt.');
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
    res.status(201).json({ user: userProfile(user), csrfToken: csrf(req) });
  });
  const login = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (
      !isText(username, 1, 40) ||
      typeof password !== 'string' ||
      password.length > 128
    )
      throw httpError(400, 'Add meg a felhasználónevet és a jelszót.');
    const user = await db
      .collection('users')
      .findOne({ usernameKey: username.trim().toLocaleLowerCase('hu') });
    // Ismeretlen felhasználónál is ellenőrizzük a jelszót, hogy a válaszidő hasonló legyen.
    const dummy = 'scrypt:' + '0'.repeat(32) + ':' + '0'.repeat(128);
    if (!(await verifyPassword(password, user?.passwordHash || dummy)) || !user)
      throw httpError(401, 'Hibás felhasználónév vagy jelszó.');
    await authenticate(req, user);
    csrfCookie(req, res);
    res.json({ user: userProfile(user), csrfToken: csrf(req) });
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
    asyncHandler(async (req, res) => {
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
  app.get('/api/users/me', auth, (req, res) => res.json(userProfile(req.user)));

  return { auth, admin };
}

module.exports = { setupAuth };
