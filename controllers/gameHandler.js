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


async function startFirstRound(gameID) {
    const game = await dbHandler.getGame(gameID);
    const playerCount = game.players.length;

    // randomly assign ranks to players
    let ranks = [];
    for (let i= 1; i <= playerCount; i++) {
        ranks.push(i);
    }
    /*
    ranks.push('Greater Dalmuti', 'Lesser Dalmuti', 'Lesser Peon', 'Greater Peon');
    for (let i = 0; i < playerCount - 4; i++) {
        ranks.push('Merchant' + i);
    }
    */
    ranks = shuffle(ranks);

    // save ranks to game

    for (let i = 0; i < playerCount; i++) {
        game.players[i].rank = ranks[i];
    }
    game.currentPlayer = game.players.find(_player => _player.rank === 1).name;
    await game.save();
    await startGame(gameID);
    console.log(game.players);
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
    if (game.cardStack === []) {
        // first play
        game.cardStack = [...cards];
    } else {
        const currentNumber = game.cardStack.slice(-1).pop().find(number => number !== 13);
        if (checkCardRank(currentNumber, cards)) {
            if (cards.length === game.cardStack.slice(-1).pop().length) {
                // everything is valid
                game.cardStack.push(cards);
            }
        } 
    }
    await game.save();
}

/**
 * checks if played cards contain cards with a rank equal or higher than the current number
 * @param {number} currentNumber last played number
 * @param {number[]} cards played cards
 * @returns {boolean}
 */
function checkCardRank(currentNumber, cards) {
    cards.every(card => {
        if (card >= currentNumber && card !== 13) {
            return false;
        } else {
            return true;
        }
    });
}

/**
 * sets currentPlayer of game to next player
 * @param {number} gameID id of game
 */
async function nextTurn(gameID) {
    const game = await dbHandler.getGame(gameID);
    const player = game.players.find(_player => _player.name === game.currentPlayer);
    if (player.rank === game.players.length) {
        game.currentPlayer = game.players.find(_player => _player.rank === 1).name;
    } else {
        game.currentPlayer = game.players.find(_player => _player.rank === player.rank + 1).name;
    }
    await game.save();
}

module.exports = {
    createDeck: createDeck,
    startGame: startGame,
    firstRound: startFirstRound,
    play: playCards,
    next: nextTurn
};