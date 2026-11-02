const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    termek_nev: String,
    gyarto: String,
    kategoria: String,
    ar: Number,
    leiras: String,
    img: String
});

module.exports = mongoose.model('Item', itemSchema);
