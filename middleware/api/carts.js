const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');  // Assuming you are using MongoDB
const Item = require('../../models/item'); // Corrected path
const CartItem = require('../../models/cart'); // Corrected path

router.post('/add', (req, res) => {
    const { itemId, userId } = req.body;
    const db = req.app.locals.db;

    db.collection('items').findOne({ _id: ObjectId(itemId) }, (err, item) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const cartItem = { ...item, userId };
        db.collection('cart').insertOne(cartItem, (err, result) => {
            if (err) return res.status(500).json({ message: 'Internal server error' });

            db.collection('items').deleteOne({ _id: ObjectId(itemId) }, (err) => {
                if (err) return res.status(500).json({ message: 'Internal server error' });

                res.status(201).json(cartItem);
            });
        });
    });
});

router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const db = req.app.locals.db;

    db.collection('cart').find({ userId }).toArray((err, items) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });

        res.json(items);
    });
});

router.delete('/remove/:cartItemId', (req, res) => {
    const cartItemId = req.params.cartItemId;
    const db = req.app.locals.db;

    db.collection('cart').deleteOne({ _id: ObjectId(cartItemId) }, (err, result) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });

        res.json({ message: 'Item removed from cart' });
    });
});

module.exports = router;
