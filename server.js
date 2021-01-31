'use strict';

const http = require('http');
const express = require('express');
const fs = require('fs');
const compression = require('compression');
const socketio = require('socket.io');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// Constants
const config = require('./config');

// App
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(helmet());

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs
});
app.use('/api/*', apiLimiter);

const server = http.Server(app);

server.listen(config.get('port'), config.get('host'), function() {
  console.log(`Running on http://${config.get('host')}:${config.get('port')}`);
});