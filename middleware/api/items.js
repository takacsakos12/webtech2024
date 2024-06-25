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
    db.collection('items').find().toArray((err, results) => {
        if (err) return console.error(err);
        res.json(results);
    });
});

module.exports = router;
