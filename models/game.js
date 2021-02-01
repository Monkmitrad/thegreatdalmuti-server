const mongoose = require('mongoose');

const playerScheme = require('./player').playerScheme;

const gameScheme = new mongoose.Schema({
    gameID: Number,
    players: [playerScheme],
    gameStatus: Boolean
});

const gameModel = new mongoose.model('Game', gameScheme, 'games');

module.exports = {
    gameScheme,
    gameModel
};