const express = require('express');
const router = new express.Router();
const { body, header, validationResult } = require('express-validator');

const config = require('../config');
const dbHandler = require('../controllers/dbHandler');
const jwtHandler = require('../controllers/jwtHandler');

const baseURL = config.get('api_baseURL');

/**
 * get data for user
 */
router.get(baseURL + 'data', [
    header('authorization').exists().isString().trim().escape()
], async (req, res) => {
    try {
        validationResult(req).throw();

        // get data for user
        if (jwtHandler.checkToken(req.header('Authorization'))) {
            const jwt = req.header('Authorization');
            const decode = jwtHandler.decodeToken(jwt);
            if (await dbHandler.checkGame(decode.game)) {
                if (await dbHandler.status(decode.game)) {
                    const data = await dbHandler.gameData(decode.game, decode.name);
                    res.json({ response: data });
                } else {
                    res.status(400).json({ response: 'game has not started' });
                }
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
            console.log(err);
            res.status(400).json({ response: err });
        }
    }
});

module.exports = router;