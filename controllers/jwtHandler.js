const jwt = require('jsonwebtoken');

const config = require('../config');
const jwt_secret = config.get('jwt_secret');

/**
 * creates new jwt for player
 * @param {number} gameID 
 * @param {string} playerName
 * @returns {string} created jwt
 */
function newToken(gameID, playerName) {
    const newToken = jwt.sign({
        game: gameID,
        name: playerName
    }, jwt_secret, { expiresIn: '1d' });
    return newToken;
}

/**
 * checks if token is valid and not expired
 * @param {string} token
 * @returns {boolean} true = token valid, false = token expired or unvalid
 */
function checkToken(token) {
    try {
        jwt.verify(token, jwt_secret);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
}

function decodeToken(token) {
    try {
        decoded = jwt.decode(token);
        delete decoded.iat;
        delete decoded.exp;
        return decoded;4
    } catch (error) {
        return null;
    }
}

module.exports = {
    newToken: newToken,
    checkToken: checkToken,
    decodeToken: decodeToken
}