var mongoose = require('mongoose');
var cloudinary = require('../cloudinary');

var Schema = mongoose.Schema;

var category = new Schema({
	slug_id: { type: String, required: true }, 
	name: { type: String, required: true },
	url: { type: String, required: true },
	icon: { type: String },
	sub_categories: []
	// designers: [],
	// amount: { type: Number }
},{
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
});

category.virtual('image').get(function () {
	return cloudinary.url(this.icon, 'png', {width: 25, crop: "scale"});
});

module.exports = mongoose.model('Category', category);
