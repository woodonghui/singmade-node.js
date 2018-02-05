var mongoose = require('mongoose');
var cloudinary = require('../cloudinary');
var _ = require('underscore');

require('../models/designer');


function replacenewline (value) {
	return value.replace(/\n/g, '<br>');
}

var schemaOptions = {
	toObject: {virtuals: true},
	toJSON: {virtuals: true}
};
var Schema = mongoose.Schema;

var schema = new Schema({

	// primary key
	slug_id: { type: String, required: true , unique: true},
	
	// product properties
	title: { type: String, required: true },
	group: {type: String, required: false }, //lady, gent, home, arts, unisex
	category: { type: String, required: false }, //bag, shoe, clothing
	subcategory: { type: String, required: false }, //shirts, dresses
	tags: [],
	description: {type: String, set: replacenewline},

	// price
	price: { type: Number, default: 0 },
	base_price: { type: Number, default: 0 },
	currency: { type: String, enum: ['SGD', 'USD', 'CNY'], default: 'SGD' },
	
	// image storage
	cloudinary: {
		images: [{
			public_id: { type: String, required: true },
			format: { type: String, required: true, default: 'jpg' },
			width: { type: Number, required: true },
			height: { type: Number, required: true }
		}],
		cover: {type: Number, default: 0} // cover image index in array images
	},

	// public critiera
	status: {type: String, enum: ['pending', 'approved'], default: 'pending'},
	
	// foreign key
	designer: { type: String, ref: 'Designer' }, // designer._id
	designer_id: { type: String }, // deprecated by 'designer'
	
	
	// displaying property
	feature: {type: Number, default: 0}, //1-10
	date: {type: Date, default: Date.now},

	//pending property
	selections: {},
	details: {},
	remark: {type:String}
	
}, schemaOptions);


schema.virtual('description_edit').get(function () {
	if(_.isEmpty(this.description)) return '';
	return this.description.replace(/<br>/g, '\n');
});


schema.virtual('tag').get(function () { // list tag only feature is gte 5
	if (_.isEmpty(this.tags)){ //|| !this.feature || this.feature < 5
		return null;
	}
	return _.first(this.tags);
});

schema.virtual('grid_images').get(function () {

	var first = this.getCoverImage();
	return {
		grid_1: cloudinary.url(first.public_id, first.format, {width: 200, height: 200,  crop: "fill"}),
		grid_1_2: cloudinary.url(first.public_id, first.format, {width: 200, height: 157,  crop: "fill"}),
		grid_2: cloudinary.url(first.public_id, first.format, {width: 200, height: 200,  crop: "fill"}),
		grid_3: cloudinary.url(first.public_id, first.format, {width: 130, height: 200,  crop: "fill"}),
		grid_4: cloudinary.url(first.public_id, first.format, {width: 350, height: 315,  crop: "fill"})
	};
});

schema.virtual('detail_images').get(function () {
	var arr = [];
	_.each(this.cloudinary.images, function(img){
		arr.push(
			{
				public_id: img.public_id,
				width: img.width,
				height: img.height,
				large: cloudinary.url(img.public_id, img.format),
				medium: cloudinary.url(img.public_id, img.format, { width: 450,  crop: "scale" }),
				thumbnail: cloudinary.url(img.public_id, img.format, { width: 79, height: 79, crop: "fill" })
			}
		);	
	});
	return arr;
});

schema.virtual('waterfall_image').get(function () {
	var cover = this.getCoverImage();
	return {width: cover.width, height: cover.height, url: cloudinary.url(cover.public_id, cover.format, {width: 180, crop: "scale"})};
});

schema.virtual('table_image').get(function () {
	var cover = this.getCoverImage();
	return {url: cloudinary.url(cover.public_id, cover.format, {width: 250, height: 250,  crop: "fill"})};
});

schema.virtual('thumbnail_image').get(function () {
	var cover = this.getCoverImage();
	return {url: cloudinary.url(cover.public_id, cover.format, {width: 79, height: 79,  crop: "fill"})};
});

/* Instance methods */
schema.methods.getCoverImage = function(){
	if (_.isEmpty(this.cloudinary.images)){
		return {
			public_id: 'singmade-logo-i_vf9sbv',
			format: 'png',
			width: 150,
			height: 150
		};
	}

	if(this.cloudinary.cover && (this.cloudinary.cover < this.cloudinary.images.length)){
		return this.cloudinary.images[this.cloudinary.cover];
	}

	return _.first(this.cloudinary.images);
};

schema.methods.approved = function(){
	return this.status == "approved";
};

/* Statics methods */
schema.statics.findOneBySlugId = function(slugId, cb) {
	this.findOne({slug_id: slugId}).populate('designer').exec(cb);
};

/*
schema.virtual('status_enum').get(function () {
	return schema.schema.path('status').enumValues;
});
*/

module.exports = mongoose.model('Piece', schema);