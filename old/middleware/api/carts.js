const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');

// Add item to cart
router.post('/add', (req, res) => {
    const { itemId, userId } = req.body;
    const db = req.app.locals.db;

    db.collection('items').findOne({ _id: ObjectId(itemId) }, (err, item) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const cartItem = { ...item, userId, original_id: item._id }; // Store original _id
        delete cartItem._id; // Remove _id to avoid duplication
        db.collection('cart').insertOne(cartItem, (err, result) => {
            if (err) return res.status(500).json({ message: 'Internal server error' });

            db.collection('items').deleteOne({ _id: ObjectId(itemId) }, (err) => {
                if (err) return res.status(500).json({ message: 'Internal server error' });

                res.status(201).json(cartItem);
            });
        });
    });
});

// Get cart items for a user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const db = req.app.locals.db;

    db.collection('cart').find({ userId }).toArray((err, items) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });

        res.json(items);
    });
});

// Remove item from cart and add it back to items
router.delete('/remove/:cartItemId', (req, res) => {
    const cartItemId = req.params.cartItemId;
    const db = req.app.locals.db;

    db.collection('cart').findOne({ _id: ObjectId(cartItemId) }, (err, cartItem) => {
        if (err) return res.status(500).json({ message: 'Internal server error' });
        if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });

        const item = {
            _id: cartItem.original_id, // Restore original _id
            termek_nev: cartItem.termek_nev,
            leiras: cartItem.leiras,
            ar: cartItem.ar,
            img: cartItem.img
        };

        db.collection('items').insertOne(item, (err, result) => {
            if (err) return res.status(500).json({ message: 'Internal server error' });

            db.collection('cart').deleteOne({ _id: ObjectId(cartItemId) }, (err) => {
                if (err) return res.status(500).json({ message: 'Internal server error' });

                res.json({ message: 'Item removed from cart and added back to items' });
            });
        });
    });
});

module.exports = router;
