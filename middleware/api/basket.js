// middleware/api/basket.js
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;
const { ObjectId } = require('mongodb');

const url = 'mongodb://localhost:27017';
const dbName = 'store';

let db;

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    db = client.db(dbName);
});

router.post('/add', (req, res) => {
    const itemId = req.body.itemId;
    const userId = req.session.uid;

    db.collection('items').findOne({ _id: ObjectId(itemId) }, (err, item) => {
        if (err) return console.error(err);
        if (!item) return res.status(404).send('Item not found');
        if (item.raktarkeszlet <= 0) return res.status(400).send('Item is out of stock');

        const basketItem = { ...item, userId: ObjectId(userId) };
        delete basketItem._id;  // Remove the existing _id field

        db.collection('basket').insertOne(basketItem, (err, result) => {
            if (err) return console.error(err);
            db.collection('items').updateOne(
                { _id: ObjectId(itemId) },
                { $inc: { raktarkeszlet: -1 } },
                (err, result) => {
                    if (err) return console.error(err);
                    res.json({ message: 'Item added to basket', item: basketItem });
                }
            );
        });
    });
});

router.get('/', (req, res) => {
    const userId = req.session.uid;

    db.collection('basket').find({ userId: ObjectId(userId) }).toArray((err, results) => {
        if (err) return console.error(err);
        let totalCost = results.reduce((sum, item) => sum + item.ar, 0);
        res.json({ items: results, totalCost: totalCost });
    });
});

module.exports = router;
