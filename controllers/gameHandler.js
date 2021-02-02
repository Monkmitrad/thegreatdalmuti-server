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
    for (let i = 0; i < game.players.length; i ++) {
        for (let j = 0; j < cardsPerPlayer; j ++) {
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
    ranks.push('Greater Dalmuti', 'Lesser Dalmuti', 'Lesser Peon', 'Greater Peon');
    for (let i = 0; i < playerCount - 4; i++) {
        ranks.push('Merchant' + i);
    }
    ranks = shuffle(ranks);

    // save ranks to game
    
    for (let i = 0; i < playerCount; i++) {
        game.players[i].rank = ranks[i];
    }
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
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

module.exports = {
    createDeck: createDeck,
    startGame: startGame,
    firstRound: startFirstRound
};