const mongoose = require('mongoose');
const config = require('../config');

mongoose.connect(`mongodb://${config.get("db_host")}:${config.get("db_port")}/${config.get("db_name")}`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Connection to MongoDB established');
});

// Models

const gameModel = require('../models/game').gameModel;
const playerModel = require('../models/player').playerModel;
const deckModel = require('../models/deck');

// DB methods

/**
 * creates a new game
 * @returns {Promise<number>} gameID of created game
 */
async function createGame() {
    const gameID = generateGameID();
    return gameID;
}

/**
 * add a new player to an existing game
 * @param {number} gameID 4-digit number
 * @param {string} playerName name of player
 * @returns {Promise<string>} jwt for further authorization
 */
async function loginPlayer(gameID, playerName) {
    const game = await getGame(gameID);
    
    return 'jwt';
}

/**
 * set ready status of a player
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @param {boolean} readyStatus true = ready, false = not ready
 * @returns {Promise<void>}
 */
async function playerReady(gameID, playerName, readyStatus) {
    
}

// Additional methods

/**
 * generates a random 4 digit number
 * @returns {number} generated 4-digit number
 */
function generateGameID() {
	const id = (Math.floor(Math.random() * 10000) + 10000)
		.toString()
        .substring(1);
    if ((Math.log(id) * Math.LOG10E + 1 | 0 ) === 4) {
        // 4 digit number
        return Number(id);
    } else {
        // 3 digit number, for now just add 1000 as the 4th digit
        return Number(id) + 1000;
    }
}

/**
 * checks if a game with the given gameID exists
 * @param {number} gameID id of game
 * @returns {Promise<boolean>} does game exist
 */
async function checkGame(gameID) {
    try {
        if (await gameModel.findOne({gameID})) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

/**
 * fetches game document for gameID in db and returns as object
 * @param {number} gameID id of game
 * @returns {Promise<gameModel>} requested game object
 */
async function getGame(gameID) {
    try {
        return await gameModel.findOne({gameID});
    } catch (error) {
        throw error;
    }
}

/**
 * checks if playerName already exists in game
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @returns {Promise<boolean>} false = name already exists, true = name is free
 */
async function checkPlayer(gameID, playerName) {
    const game = await getGame(gameID);
    const player = game.players.find((player) => player.name === playerName);
    if (player) {
        // name already in use
        return false;
    } else {
        // name not used
        return true;
    }
}

module.exports = {
    create: createGame,
    login: loginPlayer,
    ready: playerReady,
    checkGame: checkGame,
    checkPlayer: checkPlayer
};
