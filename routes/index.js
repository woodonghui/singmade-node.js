var PieceModel = require('../models/piece');
var async = require('async');

module.exports = function(app) {

	app.get('/', function(req, res) {
		var local = {};
		async.series(
			[
				function(callback){
					PieceModel.find(null, 'slug_id title designer cloudinary grid_images', {limit: 4, sort: {feature: -1}}).populate('designer').exec( 
						function (err, pieces) {
							local.grid3 = pieces;
							callback();
					});
				},
				// function(callback){
				// 	PieceModel.find({category: 'clothing'}, 'slug_id title designer cloudinary grid_images', {limit: 4, sort: {feature: -1}}).populate('designer').exec( 
				// 		function (err, pieces) {
				// 			local.grid3 = pieces;
				// 			callback();
				// 	});
				// }
			],

			function(err){
				res.render('home1', {grid3: local.grid3});//grid3: local.grid3
			}
		);
		
	});

	app.get('/company/:text(about-us|collaboration|privacy-policy|terms-and-conditions)?', function(req, res) {
		res.render('company/index', {text: req.params.text || 'about-us' });
	});

	app.get('/categories', function(req, res){
		res.render('categories');
	});

};



