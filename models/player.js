const mongoose = require('mongoose');

const playerScheme = new mongoose.Schema({
    name: String,
    ready: Boolean,
    jwt: String,
    cards: Array,
    rank: Number,
    points: Number
});

const playerModel = new mongoose.model('Player', playerScheme, 'players');

module.exports = {
    playerScheme,
    playerModel
};