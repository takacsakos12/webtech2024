const { ObjectId } = require('mongodb');
const { asyncHandler, httpError, isObjectId } = require('../lib/http');
const { getCart, saveCart } = require('../services/cart');

function cartRoutes(app, db, auth) {
  app.get(
    '/api/cart',
    auth,
    asyncHandler(async (req, res) => res.json(await getCart(db, req.user)))
  );
  app.post(
    '/api/cart/add',
    auth,
    asyncHandler(async (req, res) => {
      const { quantity = 1 } = req.body;
      const itemId =
        typeof req.body.itemId === 'string'
          ? req.body.itemId.toLowerCase()
          : req.body.itemId;
      if (
        !isObjectId(itemId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      )
        throw httpError(400, 'Érvénytelen termék vagy mennyiség.');
      if (
        !(await db.collection('items').findOne({ _id: new ObjectId(itemId) }))
      )
        throw httpError(404, 'A termék nem található.');
      const cart = req.user.cart || [];
      const entry = cart.find((entry) => entry.itemId === itemId);
      if (entry) {
        if (entry.quantity + quantity > 99)
          throw httpError(400, 'Legfeljebb 99 darab tehető a kosárba.');
        entry.quantity += quantity;
      } else {
        if (cart.length >= 100) throw httpError(400, 'A kosár megtelt.');
        cart.push({ itemId, quantity });
      }
      await saveCart(db, req.user, cart);
      res.status(201).json(await getCart(db, { cart }));
    })
  );
  app.patch(
    '/api/cart/:itemId',
    auth,
    asyncHandler(async (req, res) => {
      const { quantity } = req.body;
      if (
        !isObjectId(req.params.itemId) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99
      )
        throw httpError(400, 'A mennyiség 1–99 közötti egész szám legyen.');
      const cart = req.user.cart || [];
      const entry = cart.find(
        (entry) => entry.itemId === req.params.itemId.toLowerCase()
      );
      if (!entry) throw httpError(404, 'A termék nincs a kosárban.');
      entry.quantity = quantity;
      await saveCart(db, req.user, cart);
      res.json(await getCart(db, { cart }));
    })
  );
  app.delete(
    '/api/cart/remove/:itemId',
    auth,
    asyncHandler(async (req, res) => {
      if (!isObjectId(req.params.itemId))
        throw httpError(400, 'Érvénytelen termékazonosító.');
      const cart = (req.user.cart || []).filter(
        (entry) => entry.itemId !== req.params.itemId.toLowerCase()
      );
      await saveCart(db, req.user, cart);
      res.json(await getCart(db, { cart }));
    })
  );
}

module.exports = { cartRoutes };
