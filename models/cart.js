const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    termek_nev: { type: String, required: true },
    leiras: { type: String, required: true },
    ar: { type: Number, required: true },
    img: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('cart', cartItemSchema);
