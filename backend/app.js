const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const path = require('node:path');
const { asyncHandler, httpError } = require('./lib/http');
const { setupAuth } = require('./routes/auth');
const { productRoutes } = require('./routes/products');
const { cartRoutes } = require('./routes/cart');
const { orderRoutes } = require('./routes/orders');

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
      return next(httpError(400, 'Érvénytelen kérés.'));
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
  const { auth, admin } = setupAuth(app, db, production);
  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      await db.command({ ping: 1 });
      res.json({ status: 'ok' });
    })
  );

  productRoutes(app, db, auth, admin);
  cartRoutes(app, db, auth);
  orderRoutes(app, db, auth);

  app.use('/api', (_req, _res, next) =>
    next(httpError(404, 'Ez a végpont nem található.'))
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
      express.static(path.join(__dirname, '../frontend/public'), {
        index: 'index.html',
      })
    );
  }
  app.use((_req, _res, next) =>
    next(httpError(404, 'Az oldal nem található.'))
  );
  app.use((err, _req, res, _next) => {
    const status = err.code === 11000 ? 409 : err.status || 500;
    if (err.type === 'entity.parse.failed')
      err.message = 'Érvénytelen JSON-kérés.';
    if (err.type === 'entity.too.large') err.message = 'A kérés túl nagy.';
    if (status >= 500) console.error('Request failed:', err.message);
    let message = err.message;
    if (err.code === 11000)
      message = 'Ez a felhasználónév vagy e-mail-cím már foglalt.';
    if (status >= 500) message = 'Átmeneti szerverhiba. Próbáld újra később.';
    res.status(status).json({ message });
  });
  return app;
}
module.exports = { createApp };
