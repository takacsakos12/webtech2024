const express = require('express');
const router = express.Router();
const User = require('../../models/user');

// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        res.status(500).send(err);
    }
});

// Update a user
router.put('/', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.body._id, req.body, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;
