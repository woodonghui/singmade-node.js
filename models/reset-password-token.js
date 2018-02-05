var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
	user_id: { type: String, required: true, lowercase: true, trim: true },
	token: { type: String, required: true },
	expired: { type: Boolean, required: true, default: false },
	date: { type: Date, default: Date.now }
});

var resetPasswordToken = mongoose.model('ResetPasswordToken', schema);

module.exports = resetPasswordToken;