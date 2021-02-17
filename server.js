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

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // limit each IP to 500 requests per windowMs
});
app.use('/api/*', apiLimiter);

// Catch Postman requests
app.all('*', async (req, res, next) => {
  if (req.header('postman-token')) {
    res.status(403).json({response: 'Forbidden'});
  } else {
    next();
  }
});

// Rewrite bearer token
app.all('/api/*', (req, res, next) => {
  if(req.header('Authorization')) {
    req.headers['authorization'] = req.header('Authorization').replace('Bearer ', '');
  }
  next();
});

// Catch bad json
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
      console.error(err);
      return res.status(400).send({response: err.message });
  }
  next();
});

// Routers
const lobbyRouter = require('./routes/lobbyRouter');
const gameRouter = require('./routes/gameRouter');

app.use(lobbyRouter);
app.use(gameRouter);

app.all('/api/', (req, res) => {
  res.json({response: 'This API endpoint does not exist'});
});

app.all('/api/*', (req, res) => {
  res.json({response: 'This API endpoint does not exist'});
});

// Create and start http server
const server = http.Server(app);

server.listen(config.get('port'), config.get('host'), function() {
  console.log(`Running on http://${config.get('host')}:${config.get('port')}`);
});

// Serve static files
app.get('*.*', express.static(config.get('app_folder'), {maxAge: '1y'}));

app.get('*', (req, res) => {
  try {
      if (fs.existsSync(config.get('app_folder'))) {
              res.status(200).sendFile(`/`, {root: config.get('app_folder')});
      } else {
              res.status(404).send('404');
      }
  } catch (error) {
      console.log(error);
      res.status(500).send();
  }
});