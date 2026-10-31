const { randomUUID } = require('node:crypto');
const { asyncHandler, httpError, isText } = require('../lib/http');
const { getCart } = require('../services/cart');

function orderRoutes(app, db, auth) {
  app.get('/api/orders', auth, (req, res) =>
    res.json((req.user.orders || []).slice().reverse())
  );
  app.get('/api/orders/:orderId', auth, (req, res, next) => {
    const order = (req.user.orders || []).find(
      (order) => order.id === req.params.orderId
    );
    if (!order) return next(httpError(404, 'A rendelés nem található.'));
    res.json(order);
  });
  app.post(
    '/api/orders',
    auth,
    asyncHandler(async (req, res) => {
      const { name, address, paymentMethod } = req.body;
      if (
        !isText(name, 3, 120) ||
        !isText(address, 10, 300) ||
        paymentMethod !== 'cash_on_delivery'
      )
        throw httpError(
          400,
          'Add meg a nevet, a teljes szállítási címet és az utánvétes fizetést.'
        );
      const { items, total } = await getCart(db, req.user);
      if (!items.length) throw httpError(400, 'A kosarad üres.');
      if ((req.user.orders || []).length >= 100)
        throw httpError(
          409,
          'Elérted a bemutatóban tárolható rendelések számát.'
        );
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
      // A rendelés mentése és a kosár ürítése együtt történik.
      const result = await db.collection('users').updateOne(
        { _id: req.user._id, cartVersion: req.user.cartVersion },
        {
          $push: { orders: order },
          $set: { cart: [] },
          $inc: { cartVersion: 1 },
        }
      );
      if (!result.matchedCount)
        throw httpError(
          409,
          'A kosár közben megváltozott. Ellenőrizd a rendeléseidet.'
        );
      res.status(201).json(order);
    })
  );
}

module.exports = { orderRoutes };
