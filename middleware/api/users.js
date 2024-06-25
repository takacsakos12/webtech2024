const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';
const dbName = 'store';

let db;

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) return console.error(err);
    db = client.db(dbName);
});

router.get('/', (req, res) => {
    db.collection('users').find().toArray((err, results) => {
        if (err) return console.error(err);
        res.json(results);
    });
});

router.post('/register', (req, res) => {
    const newUser = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.email,
        birth: req.body.birth,
        id: uuidv4(),
        cart: []
    };

    db.collection('users').findOne({ $or: [{ username: newUser.username }, { email: newUser.email }] }, (err, user) => {
        if (err) return console.error(err);
        if (user) {
            res.redirect('/error.html');
        } else {
            db.collection('users').insertOne(newUser, (err, result) => {
                if (err) return console.error(err);
                res.redirect('/sikerreg.html');
            });
        }
    });
});

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.collection('users').findOne({ username, password }, (err, user) => {
        if (err) return console.error(err);
        if (!user) {
            res.redirect('/error.html');
        } else {
            req.session.uid = user.id;
            res.redirect('/webshop.html');
        }
    });
});

module.exports = router;
