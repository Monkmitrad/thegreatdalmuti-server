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
 * @param {String} playerName name of player
 * @returns {Promise<string>} jwt for further authorization
 */
async function loginPlayer(gameID, playerName) {
    return 'jwt';
}

/**
 * set ready status of a player
 * @param {Number} gameID 
 * @param {String} playerName 
 * @param {Boolean} readyStatus
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

module.exports = {
    create: createGame,
    login: loginPlayer,
    ready: playerReady
};
