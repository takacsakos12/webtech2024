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

// Fetch all items
router.get('/', (req, res) => {
    db.collection('items').find({}, { projection: { raktarkeszlet: 0 } }).toArray((err, results) => {
        if (err) return console.error(err);
        res.json(results);
    });
});

// Add a new item
router.post('/add', (req, res) => {
    const { termek_nev, leiras, ar, img } = req.body;

    // Input validation
    if (typeof ar !== 'number' || ar <= 0) {
        return res.status(400).json({ message: 'Az árnak pozitív számnak kell lennie.' });
    }

    if (!termek_nev || !leiras || !img) {
        return res.status(400).json({ message: 'Minden mező kitöltése kötelező.' });
    }

    // Check if the item already exists
    db.collection('items').findOne({ termek_nev }, (err, existingItem) => {
        if (err) return console.error(err);
        if (existingItem) {
            return res.status(400).json({ message: 'Item with this name already exists.' });
        }

        // Insert the new item
        db.collection('items').insertOne({ termek_nev, leiras, ar, img }, (err, result) => {
            if (err) return console.error(err);
            res.status(201).json(result.ops[0]);
        });
    });
});

module.exports = router;
