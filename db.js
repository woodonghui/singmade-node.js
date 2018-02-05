var settings = require('./settings');
var mongoose = require('mongoose');

mongoose.connect(settings.db);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error!'));
db.once('open', console.error.bind(console, 'connection is established!'));