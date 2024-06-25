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

        const basketItem = { ...item, userId: ObjectId(userId) };
        
        db.collection('basket').insertOne(basketItem, (err, result) => {
            if (err) return console.error(err);
            res.json({ message: 'Item added to basket', item: result.ops[0] });
        });
    });
});

router.get('/', (req, res) => {
    const userId = req.session.uid;

    db.collection('basket').find({ userId: ObjectId(userId) }).toArray((err, results) => {
        if (err) return console.error(err);
        res.json(results);
    });
});

module.exports = router;
