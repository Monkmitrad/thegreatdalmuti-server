const mongoose = require('mongoose');
const config = require('../config');

mongoose.connect(`mongodb://${config.get("db_host")}:${config.get("db_port")}/${config.get("db_name")}`, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	useFindAndModify: false,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
	console.log('Connection to MongoDB established');
});

module.exports = {

};