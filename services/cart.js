const { ObjectId } = require('mongodb');
const { httpError, isObjectId } = require('../lib/http');

async function getCart(db, user) {
  const cart = (user.cart || []).filter((entry) => isObjectId(entry.itemId));
  const products = await db
    .collection('items')
    .find({ _id: { $in: cart.map((entry) => new ObjectId(entry.itemId)) } })
    .toArray();
  const items = cart.map((entry) => {
    const item = products.find(
      (product) => String(product._id) === entry.itemId
    );
    if (!item)
      throw httpError(
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
}

async function saveCart(db, user, cart) {
  const result = await db
    .collection('users')
    .updateOne(
      { _id: user._id, cartVersion: user.cartVersion },
      { $set: { cart }, $inc: { cartVersion: 1 } }
    );
  if (!result.matchedCount)
    throw httpError(
      409,
      'A kosár közben megváltozott. Frissítsd az oldalt, és próbáld újra.'
    );
}

module.exports = { getCart, saveCart };
