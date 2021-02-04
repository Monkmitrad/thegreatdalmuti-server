const express = require('express');
const router = new express.Router();
const { body, header, validationResult } = require('express-validator');

const config = require('../config');
const dbHandler = require('../controllers/dbHandler');
const jwtHandler = require('../controllers/jwtHandler');
const firstRound = require('../controllers/gameHandler').firstRound;

const baseURL = config.get('api_baseURL');

/**
 * create new game
 */
router.post(baseURL + 'create', async (req, res) => {
    const gameID = await dbHandler.create();
    res.send({ response: gameID });
});

/**
 * login user
 */
router.post(baseURL + 'login', [
    body('gameID').exists().isNumeric().trim().escape(),
    body('playerName').exists().isLength({ min: 3, max: 12 }).trim().escape()
], async (req, res) => {
    try {
        validationResult(req).throw();

        const gameID = req.body.gameID;
        const playerName = req.body.playerName;

        // login user and return jwt
        if (await dbHandler.checkGame(gameID)) {
            if (!await dbHandler.status(gameID)) {
                if (await dbHandler.checkPlayer(gameID, playerName)) {
                    const jwt = await dbHandler.login(gameID, playerName);
                    if (jwt) {
                        res.json({ response: jwt });
                    } else {
                        res.status(500).json({ response: 'Internal server error during login' });
                    }
                } else {
                    res.status(400).json({ response: 'playerName already taken' });    
                }
            } else {
                res.send(400).json({ response: 'game has already started' });
            }
        } else {
            res.status(400).json({ response: 'gameID not valid' });
        }
    } catch (err) {
        if (err.errors) {
            res.status(400).json({ response: err.errors[0].param + ' not valid' });
        } else {
            res.status(400).json({ response: err});
        }
    }
});

/**
 * make ready
 */
router.post(baseURL + 'ready', [
    body('status').exists().isBoolean().trim().escape(),
    header('authorization').exists().isString().trim().escape()
], async (req, res) => {
    try {
        validationResult(req).throw();

        const status = req.body.status;

        // save status of player
        if (jwtHandler.checkToken(req.header('Authorization'))) {
            const jwt = req.header('Authorization');
            const decode = jwtHandler.decodeToken(jwt);
            if (await dbHandler.checkGame(decode.game)) {
                if (!await dbHandler.status(decode.game)) {
                    await dbHandler.ready(decode.game, decode.name, status);
                    res.json({ response: 'Set status to ' + status });
                    if (await dbHandler.checkReady(decode.game)) {
                        console.log("Start game");
                        await dbHandler.start(decode.game);
                        await firstRound(decode.game);
                    }
                } else {
                    res.status(400).json({ response: 'game has already started' });
                }
            } else {
                res.status(400).json({ response: 'gameID not valid' });
            }
        } else {
            res.status(400).json({ response: 'authorization not valid'});
        }
    } catch (err) {
        console.log(err);
        if (err.errors) {
            res.status(400).json({ response: err.errors[0].param + ' not valid' });
        } else {
            res.status(400).json({ response: err });
        }
    }
});

/**
 * disconnect player from game
 */
router.post(baseURL + 'disconnect', [
    header('authorization').exists().isString().trim().escape()
], async (req, res) => {
    try {
        validationResult(req).throw();

        // disconnect player from game
        if (jwtHandler.checkToken(req.header('Authorization'))) {
            const jwt = req.header('Authorization');
            const decode = jwtHandler.decodeToken(jwt);

            if (await dbHandler.checkGame(decode.game)) {
                await dbHandler.disconnect(decode.game, decode.name);
                res.json({ response: 'Disconnected' });
            } else {
                res.status(400).json({ response: 'gameID not valid' });
            }
        } else {
            res.status(400).json({ response: 'authorization not valid'});
        }
    } catch (err) {
        if (err.errors) {
            res.status(400).json({ response: err.errors[0].param + ' not valid' });
        } else {
            res.status(400).json({ response: err });
        }
    }
});

router.get(baseURL + 'lobbyData' , [
    header('authorization').exists().isString().trim().escape()
], async (req, res) => {
    try {
        validationResult(req).throw();

        // get lobbyData for user
        if (jwtHandler.checkToken(req.header('Authorization'))) {
            const jwt = req.header('Authorization');
            const decode = jwtHandler.decodeToken(jwt);
            if (await dbHandler.checkGame(decode.game)) {
                if (await dbHandler.status(decode.game)) {
                    const data = await dbHandler.lobbyData(decode.game);
                    res.json({ response: data });
                } else {
                    res.status(400).json({ response: 'game has not started' });
                }
            } else {
                res.status(400).json({ response: 'gameID not valid' });
            }
        } else {
            res.status(400).json({ response: 'authorization not valid' });
        }
    } catch (err) {
        if (err.errors) {
            res.status(400).json({ response: err.errors[0].param + ' not valid' });
        } else {
            console.log(err);
            res.status(400).json({ response: err });
        }
    }
});
module.exports = router;