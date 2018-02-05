var async = require('async');
var PieceModel = require('../models/piece');
var DesignerModel = require('../models/designer');
var _ = require('../underscore-extend');
var sanitize = require('validator').sanitize;

module.exports = function(app) {

	app.get('/api/pieces/more/:designer', function(req, res){
		var designer = req.params.designer;
		var currentPieceId = req.query.currentId;

		// PieceModel.find({designer: designer}, null, {limit: 6}, function (err, pieces) {
		// 	if (err) { console.log(err); res.status(500); res.send(500); return false; }
		// 	res.status(200);
		// 	res.send(pieces);
		// });

		var more = [];
		async.series(
			[
				function(callback) {
					PieceModel.find({_id: {$lt: currentPieceId}}, 'slug_id cloudinary', {limit: 4, sort: {_id: -1}}, function (err, pieces) {
						if (err) { console.log(err); return callback(err); }
						if (pieces) more = more.concat(pieces);
						callback();
					})
				},
				
				function(callback) {
					PieceModel.find({_id: {$gt: currentPieceId}}, 'slug_id cloudinary', {limit: 4, sort: {_id: 1}}, function (err, pieces) {
						if (err) { console.log(err); return callback(err); }
						if (pieces) more = more.concat(pieces);
						callback();
					})
				}
			],
			
			function(err) {
				if (err) {res.status(500); res.send(500)};
				res.status(200); res.send(more);
			}
		);

	});
	
	app.get('/api/prenexpiece', function(req, res){
		var pieceId = req.query._id;
		var local = {};
		async.series(
			[
				function(callback) {
					PieceModel.findOne({_id: {$lt: pieceId}}, 'slug_id', {sort: {_id: -1}}, function (err, piece) {
						if (err) { console.log(err); return callback(err); }
						if (piece) local.pre = piece.slug_id;
						callback();
					})
				},
				
				function(callback) {
					PieceModel.findOne({_id: {$gt: pieceId}}, 'slug_id', {sort: {_id: 1}}, function (err, piece) {
						if (err) { console.log(err); return callback(err); }
						if (piece) local.nex = piece.slug_id;
						callback();
					})
				}
			],
			
			function(err) {
				if (err) {res.status(500); res.send(500)};
				res.status(200); res.send(local);
			}
		);	
	});
	

	app.get('/piece/:slug', function(req, res) {
		var slugId = req.params.slug;
		PieceModel.findOneBySlugId(slugId, function (err, piece) {
		  // if (!piece || !piece.approved()) { res.render('404', {user: req.user}); return false; } 
		  if (!piece) { res.render('404', {user: req.user}); return false; } 
		  res.render('piece', { user: req.user, piece: piece, designer: piece.designer });
		});
	});


	app.get('/designer/:designer([a-zA-Z-]+)(?:/:page([0-9]+))?',
		
		function(req, res) {

			var queryObject = _.pick(req.query, 'tags');
			var sortObject = _.pick(req.query, 'price', 'date');
			var queryString = _.queryObject(queryObject);
			var sortString = _.queryObject(sortObject);

			var designerId = req.params.designer;
			// var query = _.compactObject({designer: designerId, status: 'approved'});
			var query = _.extend({designer: designerId}, queryObject);


			var page = req.params.page ? sanitize(req.params.page).toInt() : 1;
			var pageSize = 12; //16
			var data = {};
			var breadcrumb = ['designer', designerId];

			async.series([

				function(callback) {
					DesignerModel.findById(designerId, function (err, designer) {
						if (err || !designer) { console.log(err); return callback(new Error('no_designer')); } 
						data.designer = designer;
						callback();
					});
				},

				function(callback) {
					PieceModel.find({designer: designerId}, 'slug_id title cloudinary grid_images tags feature', {limit: 4, sort: {feature: -1}}, function (err, pieces) {
						data.grid = pieces;
						callback();
					});
				},

				// function(callback) {
				// 	PieceModel.find({designer: designerId}).distinct('tags', function (err, tags) {
				// 		if(!_.isEmpty(tags)) { data.tags = _.compact(tags); }
				// 		callback();
				// 	});
				// },

				// TODO: slow query
				function(callback) { // get max page
					PieceModel.count(query, function(err, c){
						if (err) { console.log(err); return callback(err); } 
						if (c==0) return callback(new Error('no_records'));
						data.maxPage = Math.ceil(c/pageSize);
						if (page > data.maxPage) page = data.maxPage;
						callback();
					});
				},
			
				function(callback){ // get current page 

					// build sort options
					var sort = {$natural:-1};
					if(!_.isEmpty(sortObject)) {
						_.each(sortObject, function(v, k, o){
							o[k] = v == '-1' ? -1 : 1;
						});
						sort = sortObject;
					}

					// query documents
					PieceModel.find(query, 'slug_id title designer price cloudinary', {skip: (page-1)*pageSize, limit: pageSize, sort: sort}, function(err, pieces){
						if (err) { console.log(err); return callback(err); } 
						data.pieces = pieces;
						callback();
					});
				}
			],	
		
			function(err) {
				if (err) {
					if(err.message == 'no_records') {
						res.render('list/by-designer', { designer: data.designer, pieces: null, breadcrumb: breadcrumb });
						return false;
					}
					// TODO: No designer found
					res.render('404', { user: req.user }); return false; 
				}

				res.render('list/by-designer', { 
					grid: data.grid,
					designer: data.designer, pieces: data.pieces, 
					breadcrumb: breadcrumb, query: queryString, sort: sortString,
					currentPage: page, maxPage: data.maxPage } );
			});
	});


	app.get('/api/pieces/designer/:designer([a-zA-Z-]+)(?:/:page([0-9]+))?', function(req, res){
		var designerId = req.params.designer;
		var page = req.params.page;
		PieceModel.find({designer: designerId}, 'slug_id title designer price cloudinary', {skip: page*15, limit: 15}, function (err, pieces) {
		  if (err) {console.log(err);}
		  res.send(pieces);
		});
	});

	app.get('/wall',function(req, res) {
		var breadcrumb = ['wall'];
		res.render('list/by-category', { breadcrumb: breadcrumb, defaultView: 'wall'});
	});

	app.get('/api/pieces/wall(?:/:page([0-9]+))?', 
		function(req, res) {
			var page = req.params.page;
			PieceModel.find(req.mongoQuery, 'slug_id title designer price cloudinary', {skip: page*15, limit: 15}, function (err, pieces) {
			  if (err) { console.log(err); }
			  res.send(pieces);
			});
		}
	);

	app.get('/:group(lady|gent)(?:/:category([a-zA-Z-]+))?(?:/:subcategory([a-zA-Z-]+))?(?:/:page([0-9]+))?',
		
		function(req, res, next) {
			var group = req.params.group;
			var category = req.params.category;
			var subcategory = req.params.subcategory;

			var breadcrumb = _.compact([group, category, subcategory]);
			var query = _.compactObject({group: group, category: category, subcategory: subcategory});
			
			req.mongoQuery = query;
			req.breadcrumb = breadcrumb;
			
			next();
		},

		function(req, res, next) {
			if (req.query.view == 'wall') {
				res.render('list/by-category', { 
					user: req.user, 
					breadcrumb: req.breadcrumb, 
					defaultView: 'wall'
				});
			}else{
				next();
			}
		},

		function(req, res) {
			var page = req.params.page ? sanitize(req.params.page).toInt() : 1;
			var pageSize = 16;
			var data = {};
			async.series([
				function(callback) { // get max page
					PieceModel.count(req.mongoQuery, function(err, c){
						if (err) { console.log(err); return callback(err); } 
						else {
							if (c==0) return callback(new Error('no_records'));
							data.maxPage = Math.ceil(c/pageSize);
							if (page > data.maxPage) page = data.maxPage;
							callback();
						}
					});
				},
			
				function(callback){ // get current page 
					PieceModel.find(req.mongoQuery, 'slug_id title designer price cloudinary', {skip: (page-1)*pageSize, limit: pageSize}, function(err, pieces){
						if (err) { console.log(err); return callback(err); } 
						else {
							data.pieces = pieces;
							callback();
						}
					});
				}
			], 	
		
			function(err) {
				if (err) {
					if (err.message == 'no_records') {
						res.render('list/by-category', { user: req.user, breadcrumb: req.breadcrumb, defaultView: 'table', pieces: null }); 
					}else {
						res.render('500', { user: req.user }); 
					}
					return false;
				}

				res.render('list/by-category', {
					user: req.user, breadcrumb: req.breadcrumb, pieces: data.pieces,
					currentPage: page, maxPage: data.maxPage, defaultView: 'table' 
				});
				
			});
	});

	app.get('/api/pieces/:group(lady|gent)(?:/:category([a-zA-Z-]+))?(?:/:subcategory([a-zA-Z-]+))?(?:/:page([0-9]+))?', 
		function(req, res, next) {
			var group = req.params.group;
			var category = req.params.category;
			var subcategory = req.params.subcategory;

			var query = _.compactObject({group: group, category: category, subcategory: subcategory});
			req.mongoQuery = query;
			next();
		},

		function(req, res) {
			var page = req.params.page;
			PieceModel.find(req.mongoQuery, 'slug_id title designer price cloudinary', {skip: page*15, limit: 15}, function (err, pieces) {
			  if (err) { console.log(err); }
			  res.send(pieces);
			});
		}
	);

};




