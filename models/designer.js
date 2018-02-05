var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Designer = new Schema({
	_id: { type: String, required: true, lowercase: true, trim: true }, //slugs(name)
	name: { type: String, required: true },
	title: { type: String },
	profile: { type: String },
	country: {type: String},
	city: {type: String},
	type: { type: String, default: 'freelance' }, //["freelance", "commercial", "buyer"]
	avatar: {
		logo: { type: String }, // brand logo
		small: { type: String },
		large: { type: String }
	},
	
	introduction: {type: String},
	shipping: {
		from_city: {type: String},
		estimated_time: {type: Number}
	},
	brand: {type:String}

});

module.exports = mongoose.model('Designer', Designer);
