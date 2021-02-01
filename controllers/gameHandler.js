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
    console.log(overflow);
    for (let i = 0; i < overflow; i++) {
        newDeck.pop();
    }

    const cardsPerPlayer = newDeck.length / game.players.length;
    console.log(cardsPerPlayer);
    for (let i = 0; i < game.players.length; i ++) {
        for (let j = 0; j < cardsPerPlayer; j ++) {
            game.players[i].cards.push(newDeck.pop());
        }
    }
    console.log(newDeck);
    console.log(game.players);
    await game.save();
}

/**
 * creates a new deck with all needed cards
 */
function createDeck() {
    const deck = [];

    // fill deck
    for (let i = 1; i <= 12; i++) {
        for (let j = 0; j < i; j++) {
            deck.push(i);
        }
    }
    // add jesters (represented by '13')
    deck.push(13);
    deck.push(13);
    console.log('Filled deck: ', deck);

    // shuffle deck
    for(let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * i);
        const temp = deck[i];
        deck[i] = deck[j];
        deck[j] = temp;
    }
    console.log('Shuffled deck:', deck);
    return deck;
}

module.exports = {
    createDeck: createDeck,
    startGame: startGame
}