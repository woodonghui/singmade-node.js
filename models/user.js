var mongoose = require('mongoose');
var Schema = mongoose.Schema;

require('../models/designer');

/*
function toLower (value) { 
  return value.toLowerCase();
}
*/

var schema = new Schema({
	user_id: { type: String, required: true, lowercase: true, trim: true }, //set: toLower
	provider: { type: String, required: true, default: 'local' },
	displayName: { type: String, trim: true },
	profile_image_url: { type: String },
	password: { type: String, trim: true },
	email: { type: String, lowercase: true, trim: true },
	user_type: { type: String, enum: ['admin', 'designer', 'customer'], default: 'customer' },
	designer: { type: String, ref: 'Designer' }, // designer._id
	title: {type: String},
	address: {type: String},
	phone: {type: String},
	created_date: { type: Date, default: Date.now }
});
schema.index({user_id: 1, provider: 1}, {unique: true});
var User = mongoose.model('User', schema);


User.ifUserExist = function ifUserExist(userId, callback){
	User.findOne({ provider: 'local', user_id: userId.trim().toLowerCase() }, function(err, user){
		if(err) { return callback(err, null) }
		if(user) { return callback(null, user); } else { return callback(null, null); }
	});
};

User.ifEmailExist = function ifEmailExist(email, callback){
	User.findOne({ email: email.trim().toLowerCase() }, function(err, user){
		if(err) { return callback(err, null) }
		if(user) { return callback(null, user); } else { return callback(null, null); }
	});
};

module.exports = User;



