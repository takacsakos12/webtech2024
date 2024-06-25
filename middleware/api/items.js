const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'store';

let db;

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    db = client.db(dbName);
});

router.get('/', (req, res) => {
    db.collection('items').find({}, { projection: { raktarkeszlet: 0 } }).toArray((err, results) => {
        if (err) return console.error(err);
        res.json(results);
    });
});

router.post('/add', (req, res) => {
    const { termek_nev, leiras, ar, img } = req.body;

    db.collection('items').findOne({ termek_nev }, (err, existingItem) => {
        if (err) return console.error(err);
        if (existingItem) {
            return res.status(400).json({ message: 'Item with this name already exists.' });
        }

        db.collection('items').insertOne({ termek_nev, leiras, ar, img }, (err, result) => {
            if (err) return console.error(err);
            res.status(201).json(result.ops[0]);
        });
    });
});

module.exports = router;
