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

const jwtHandler = require('./jwtHandler');

// DB methods

/**
 * creates a new game
 * @returns {Promise<number>} gameID of created game
 */
async function createGame() {
    const gameID = generateGameID();
    const newGame = new gameModel({
        gameID,
        players: [],
        gameStatus: false,
        currentPlayer: '',
        cardStack: [],
        lastPlayed: '',
        remainingPlayers: []
    });
    await newGame.save();
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
    const token = jwtHandler.newToken(gameID, playerName);
    const newPlayer = new playerModel({
        name: playerName,
        ready: false,
        jwt: token,
        cards: [],
        rank: '',
        points: 0,
    });
    game.players.push(newPlayer);
    await game.save();
    return token;
}

/**
 * set ready status of a player
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @param {boolean} readyStatus true = ready, false = not ready
 * @returns {Promise<void>}
 */
async function playerReady(gameID, playerName, readyStatus) {
    const game = await getGame(gameID);
    const playerIndex = game.players.findIndex(_player => _player.name === playerName);
    game.players[playerIndex].ready = readyStatus;
    await game.save();
}

/**
 * disconnects player from a game
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @returns {Promise<void>}
 */
async function disconnectPlayer(gameID, playerName) {
    const game = await getGame(gameID);
    const playerIndex = game.players.findIndex(_player => _player.name === playerName);
    game.players.splice(playerIndex, 1);
    await game.save();
}

/**
 * starts game
 * @param {number} gameID id of gamg
 * @returns {Promise<void>}
 */
async function startGame(gameID) {
    const game = await getGame(gameID);
    game.gameStatus = true;
    await game.save();
}

/**
 * fetches and returns game data for specific
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @returns {Promise<gameModel>} gameData
 */
async function getLobbyData(gameID) {
    const game = (await getGame(gameID)).toObject();
    game.players.forEach(player => {
        delete player._id;
        delete player.cards;
        delete player.jwt;
        delete player.rank;
        delete player.points;
    });
    delete game._id;
    delete game.__v;
    delete game.cardStack;
    delete game.remainingPlayers;
    delete game.lastPlayed;

    return game;
}

/**
 * fetches and returns game data for specific
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @returns {Promise<gameModel>} gameData
 */
async function getGameData(gameID, playerName) {
    const game = (await getGame(gameID)).toObject();
    game.players.forEach(player => {
        if (player.name === playerName) {
            delete player._id;
            delete player.ready;
            delete player.jwt;
        } else {
            delete player._id;
            delete player.ready;
            delete player.jwt;
            player.cards = new Array(player.cards.length);
        }
    });
    delete game._id;
    delete game.__v;
    return game;
}

/**
 * removes played cards from player cards
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @param {number[]} cards played cards
 * @returns {Promise<boolean>} true = player has finished, false = player has cards left
 */
async function removeCards(gameID, playerName, cards) {
    const game = await getGame(gameID);
    const player = game.players.find(_player => _player.name === playerName);
    cards.forEach(card => {
        const index = player.cards.indexOf(card);
        if (index > -1) {
            player.cards.splice(index, 1);
        }
    });
    // check if cards are left
    if (player.cards.length === 0) {
        // player has finished
        const index = game.remainingPlayers.indexOf(playerName);
        game.remainingPlayers.splice(index, 1);
        await game.save();
        return true;
    } else {
        await game.save();
        return false;
    }
}

/**
 * clears cardStack of game
 * @param {number} gameID id of game
 * @returns {Promise<void>}
 */
async function clearStack(gameID) {
    const game = await getGame(gameID);
    game.cardStack = [];
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
    if ((Math.log(id) * Math.LOG10E + 1 | 0) === 4) {
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
        if (await gameModel.findOne({ gameID })) {
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
        return await gameModel.findOne({ gameID });
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
    const player = game.players.find(_player => _player.name === playerName);
    if (player) {
        // name already in use
        return false;
    } else {
        // name not used
        return true;
    }
}

/**
 * returns status of the game
 * @param {number} gameID 
 * @returns {Promise<boolean>} true = game started, false = game not started
 */
async function getStatus(gameID) {
    const game = await getGame(gameID);
    return game.gameStatus;
}

/**
 * at least 4 players needed to start the game
 * check if playerCount >= 4 and every player is ready
 * @param {number} gameID 
 * @returns {boolean} true = count >= 4 and all players ready, false = count < 4 or not all players ready
 */
async function checkReady(gameID) {
    const game = await getGame(gameID);
    if (game.players.length >= 4) {
        return game.players.every((element) => {
            return element.ready;
        });
    } else {
        return false;
    }
}

/**
 * checks if play is valid
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @param {number[]} cards array with played cards
 * @returns {Promise<boolean>} 
 */
async function checkCards(gameID, playerName, cards) {
    const game = await getGame(gameID);
    const player = game.players.find(_player => _player.name === playerName);
    let searchArray = [...player.cards];
    
    // check if all played cards exists in players cards
    // true = all played cards in players cards, false = not all played cards in players cards
    const playedCardsExist = cards.every(card => {
        if (searchArray.includes(card)) {
            const index = searchArray.indexOf(card);
            searchArray.splice(index, 1);
            return true;
        } else {
            return false;
        }
    });

    // check if all cards are the same or contain a jester
    // true = all cards identical and/or combined with jester, false = not all cards are identical
    searchArray = [cards];
    if (searchArray.includes(13)) {
        // jester is played
        // splice jester card and check for another jester
        searchArray.splice(searchArray.indexOf(13));
        if (searchArray.includes(13)) {
            // another jester is played
            // splice jester card and check for another jester
            searchArray.splice(searchArray.indexOf(13));
        }
    }
    const allCardsIdentical = searchArray.every(card => card === searchArray[0]);

    // check if number of cards is identical to number of cards from last play
    const validAmount = cards.length === game.cardStack.slice(-1).pop().length;

    // check if rank of played cards are lower than current rank
    const currentNumber = game.cardStack.slice(-1).pop().find(number => number !== 13);
    const rankValid = cards.every(card => {
        if (card >= currentNumber && card !== 13) {
            return false;
        } else {
            return true;
        }
    });

    return playedCardsExist && allCardsIdentical && validAmount && rankValid;
}

/**
 * checks if player is currentPlayer
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 */
async function checkCurrentPlayer(gameID, playerName) {
    const game = await getGame(gameID);
    return game.currentPlayer === playerName;
}

/**
 * checks if player remaining
 * @param {number} gameID id of game
 */
async function checkRemainingPlayers(gameID) {
    const game = await getGame(gameID);
    if (game.remainingPlayers.length) {
        return false;
    } else {
        return true;
    }
}

module.exports = {
    create: createGame,
    login: loginPlayer,
    ready: playerReady,
    checkGame: checkGame,
    checkPlayer: checkPlayer,
    status: getStatus,
    checkReady: checkReady,
    disconnect: disconnectPlayer,
    getGame: getGame,
    start: startGame,
    lobbyData: getLobbyData,
    gameData: getGameData,
    checkCards: checkCards,
    checkCurrent: checkCurrentPlayer,
    removeCards: removeCards,
    clear: clearStack,
    remaining: checkRemainingPlayers
};
