const dbHandler = require('./dbHandler');

/**
 * initializes and starts the game 
 * @param {number} gameID 
 * @returns {void}
 */
async function startGame(gameID) {
    const newDeck = createDeck();
    const game = await dbHandler.getGame(gameID);

    // calculate if cards have to be tossed out, due to uneven card/player ratio
    const overflow = newDeck.length % game.players.length;
    console.log('Overflow: ', overflow);
    for (let i = 0; i < overflow; i++) {
        newDeck.pop();
    }

    const cardsPerPlayer = newDeck.length / game.players.length;
    for (let i = 0; i < game.players.length; i++) {
        for (let j = 0; j < cardsPerPlayer; j++) {
            game.players[i].cards.push(newDeck.pop());
        }
    }
    await game.save();
}

/**
 * creates a new deck with all needed cards
 * @returns {number[]} array with 80 shuffled cards
 */
function createDeck() {
    let deck = [];

    // fill deck
    for (let i = 1; i <= 12; i++) {
        for (let j = 0; j < i; j++) {
            deck.push(i);
        }
    }
    // add jesters (represented by '13')
    deck.push(13);
    deck.push(13);

    // shuffle deck
    return shuffle(deck);
}

/**
 * assigns data for first round
 * @param {number} gameID id of game
 * @returns {Promise<void>}
 */
async function startFirstRound(gameID) {
    const game = await dbHandler.getGame(gameID);
    const playerCount = game.players.length;

    // randomly assign ranks to players
    let ranks = [];
    for (let i = 1; i <= playerCount; i++) {
        ranks.push(i);
    }
    ranks = shuffle(ranks);

    // save ranks to game
    for (let i = 0; i < playerCount; i++) {
        game.players[i].rank = ranks[i];

    }

    game.remainingPlayers = new Array();
    const sortArray = [...game.players];
    sortArray.sort(function (a, b) { return a.rank - b.rank });
    sortArray.forEach(player => game.remainingPlayers.push(player.name));

    game.currentPlayer = game.remainingPlayers[0];
    console.log(game.currentPlayer);
    await game.save();
    await startGame(gameID);
}

/**
 * randomly shuffles and returns the array 
 * @param {array} array array to be shuffled
 * @returns {array} shuffled array
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

/**
 * 
 * @param {number} gameID id of game
 * @param {number[]} cards played cards
 * @returns {Promise<void>}
 */
async function playCards(gameID, cards) {
    const game = await dbHandler.getGame(gameID);
    if (game.cardStack.length === 0) {
        // first play
        game.cardStack.push([...cards]);
    } else {
        game.cardStack.push([...cards]);
        game.lastPlayed = game.currentPlayer;
    }
    await game.save();
}

/**
 * sets currentPlayer of game to next player
 * @param {number} gameID id of game
 * @returns {Promise<void>}
 */
async function nextTurn(gameID) {
    const game = await dbHandler.getGame(gameID);

    const index = game.remainingPlayers.indexOf(game.currentPlayer);
    let nextPlayer;
    if (index === game.remainingPlayers.length - 1) {
        nextPlayer = game.remainingPlayers[0];
    } else {
        nextPlayer = game.remainingPlayers[index + 1];
    }

    if (nextPlayer === game.lastPlayed) {
        // all players passed their turn
        game.currentPlayer = game.lastPlayed;
        await game.save();
        await dbHandler.clear(gameID);
    } else {
        game.currentPlayer = nextPlayer;
        await game.save();
    }
}

/**
 * adds corresponding points and rank for player
 * @param {number} gameID id of game
 * @param {string} playerName name of player
 * @returns {Promise<void>}
 */
async function setWinnerPoints(gameID, playerName) {
    const game = await dbHandler.getGame(gameID);
    const player = game.players.find(_player => _player.name = playerName);
    player.points += game.remainingPlayers.length;
    
    // TODO: difference between current rank and new rank (maybe clear ranks after cards have been swapped at the beginning of the round)

    player.rank = game.players - game.remainingPlayers;
    await game.save();

}

/**
 * assigns data for next round
 * @param {number} gameID id of game
 * @returns {Promise<void>}
 */
async function nextRound(gameID) {
    const game = await getGame(gameID);

    game.remainingPlayers = new Array();
    const sortArray = [...game.players];
    sortArray.sort(function (a, b) { return a.rank - b.rank });
    sortArray.forEach(player => game.remainingPlayers.push(player.name));

    game.currentPlayer = game.remainingPlayers[0];

    console.log('Next rounds beginner: ', game.currentPlayer);
    await game.save();
    await startGame(gameID);
}

async function switchCards(gameID, playerName, cards) {
    const game = await dbHandler.getGame(gameID);
    const player = game.players.find(_player => _player.name = playerName);
    const rank = player.rank;

    if (rank === 1 && cards.length === 2) {
        const greater = game.players.find(_player => _player.rank === game.players.length);
        const min = Math.min(...greater.cards);
        let index = greater.cards.indexOf(min);
        greater.cards.splice(index, 1);
        const min2 = Math.min(...greater.cards);
        index = greater.cards.indexOf(min2);
        greater.cards.splice(index2, 1);
        greater.cards.push(cards);

        await game.save();
        await dbHandler.removeCards(gameID, playerName, cards);
    } else if (rank === 2 && cards.length === 1) {
        const lesser = game.players.find(_player => _player.rank === game.players.length - 1);
        const min = Math.min(...lesser.cards);
        const index = lesser.cards.indexOf(min);
        lesser.cards.splice(index, 1);
        
        await game.save();
        await dbHandler.removeCards(gameID, playerName, cards);
    } else {
        throw "cards not valid";
    }
}

module.exports = {
    createDeck: createDeck,
    startGame: startGame,
    firstRound: startFirstRound,
    play: playCards,
    next: nextTurn,
    points: setWinnerPoints,
    nextRound: nextRound,
    switch: switchCards
};