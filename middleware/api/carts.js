const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const CartItem = require('../models/cart');

// Add item to cart
router.post('/add', async (req, res) => {
    const { itemId, userId } = req.body;
    try {
        const item = await Item.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const cartItem = new CartItem({ ...item._doc, userId });
        await cartItem.save();

        await Item.findByIdAndDelete(itemId);

        res.status(201).json(cartItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get cart items for a user
router.get('/:userId', async (req, res) => {
    try {
        const cartItems = await CartItem.find({ userId: req.params.userId });
        res.json(cartItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Remove item from cart
router.delete('/remove/:cartItemId', async (req, res) => {
    try {
        const cartItem = await CartItem.findByIdAndDelete(req.params.cartItemId);
        if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });
        res.json({ message: 'Item removed from cart' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
