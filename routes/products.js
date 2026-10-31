const { ObjectId } = require('mongodb');
const {
  asyncHandler,
  httpError,
  isText,
  isObjectId,
  isImageUrl,
} = require('../lib/http');

function productRoutes(app, db, auth, admin) {
  app.get(
    '/api/items',
    asyncHandler(async (_req, res) => {
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
    asyncHandler(async (req, res) => {
      const { termek_nev, leiras, ar, img, kategoria, gyarto } = req.body;
      if (
        !isText(termek_nev, 2, 120) ||
        !isText(leiras, 5, 2000) ||
        !Number.isSafeInteger(ar) ||
        ar < 1 ||
        ar > 10000000 ||
        !isImageUrl(img)
      )
        throw httpError(
          400,
          'Ellenőrizd a nevet, leírást, pozitív egész árat és HTTPS-képcímet.'
        );
      if (
        (kategoria != null && !isText(kategoria, 1, 60)) ||
        (gyarto != null && !isText(gyarto, 1, 60))
      )
        throw httpError(400, 'Érvénytelen kategória vagy gyártó.');
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
    asyncHandler(async (req, res) => {
      if (!isObjectId(req.params.itemId))
        throw httpError(400, 'Érvénytelen termékazonosító.');
      const item = await db
        .collection('items')
        .findOne(
          { _id: new ObjectId(req.params.itemId) },
          { projection: { seedId: 0 } }
        );
      if (!item) throw httpError(404, 'A termék nem található.');
      res.json(item);
    })
  );
}

module.exports = { productRoutes };
