const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    birth: Date,
    money: Number,
    cart: Array
});

module.exports = mongoose.model('User', userSchema);
