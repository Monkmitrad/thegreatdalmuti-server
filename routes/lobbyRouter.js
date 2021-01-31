const express = require('express');
const router = new express.Router();
const { body, header, validationResult } = require('express-validator');

const config = require('../config');
const dbHandler = require('../controllers/dbHandler');

const baseURL = config.get('api_baseURL');

/**
 * create new game
 */
router.post(baseURL + 'create', async (req, res) => {

});


/**
 * login user
 */
router.post(baseURL + 'login',[
    body('gameID').exists().isNumeric().trim().escape(),
    body('playerName').exists().isLength({min: 3, max: 12}).trim().escape(),
], async (req, res) => {
    try {
        validationResult(req).throw();
        
        // login user and return jwt
    } catch (err) {
        if (err.errors) {
            res.status(400).json({response: err.errors[0].param + ' not valid'});
        } else {
            res.status(400).json({response: err});
        }
    }
});

/**
 * make ready
 */
router.post(baseURL + 'ready', [
    body('status').exists().isBoolean().trim().escape(),
    header('authorization').exists().isString().trim()
], async (req, res) => {
    try {
        validationResult(req).throw();

        // save status of player
    } catch (err) {
        if (err.errors) {
            res.status(400).json({response: err.errors[0].param + ' not valid'});
        } else {
            res.status(400).json({response: err});
        }
    }
});

module.exports = router;