var Designer = require('../models/designer');
var User = require('../models/user');
var Category = require('../models/category');

var cloudinary = require('../cloudinary');
var _ = require('underscore');
var slug = require ('../slug');
var async = require('async');
var PieceModel = require('../models/piece');
var sanitize = require('validator').sanitize;
var Errors = require('../errors');
var Validator = require('../validator');


module.exports = function(app) {
	
	// permission controllers
	// admin only
	app.all('/admin/:module(users|designers|designer)/:action(add|update)?', function(req, res, next) {
		// console.log('permission control: admin only');
		if (!req.user || req.user.user_type != 'admin') {
			res.render('404', {status: 404, user: req.user});
			return false;
		}
		next();
	});

	app.all('/admin/:module(products|profile)?', function(req, res, next) {
		// console.log('permission control: designer only');
		if (!req.user) {
			res.redirect('/login');
			return false;
		}
		if (req.user.user_type == 'customer') {
			res.render('404', {status: 404, user: req.user});
			return false;
		}
		next();
	});

	app.get('/admin', function(req, res) {
		User.findOne({ user_id: req.user.user_id, provider: req.user.provider }).populate('designer').exec(function (err, user) {
		  if (err) { console.log(err); res.render('500', { user: req.user }); return false; } 
		  res.render('admin', { user: req.user, designer: user.designer });
		});
	});





	

	///////////////////////////////////////////////////////////
	/////////    products management          /////////////////
	///////////////////////////////////////////////////////////
	app.get('/admin/products/:designer?', function(req, res) {
		var designer = req.user.designer;

		if(!designer && req.user.user_type != 'admin') {
			res.render('500', {status: 500, user: req.user});
			return false;
		}

		var query;
		if(req.user.user_type == 'admin'){
			query = req.params.designer ? {designer: req.params.designer} : null;
		} else {
			query = {designer: designer};
		}

		var page = sanitize(req.query.page).toInt();
		if (isNaN(page)) page = 1;
		var pageSize = 16;
		var maxPage = 0;
		var products;


		async.series([

			function(callback) { // get max page
				PieceModel.count(query, function(err, c){
					if (err) { console.log(err); return callback(err); } 
					else {
						if (c == 0) return callback(new Error('no_records'));
						maxPage = Math.ceil(c/pageSize);
						if (page > maxPage) page = maxPage;
						callback();
					}
				});
			},
		
			function(callback){ // get current page 
				PieceModel.find(query, null, {skip: (page-1)*pageSize, limit: pageSize}, function(err, pieces){
					if (err) { console.log(err); return callback(err); } 
					products = pieces; 
					callback();
				});
			}
		], 	
	
		function(err) {
			if (err) { 
				res.render('admin/products', { user: req.user, products: [], currentPage: 1, maxPage: 1 });
				return false;
			}
			res.render('admin/products', { user: req.user, products: products, currentPage: page, maxPage: maxPage });
		});
	});


	// delete product
	app.get('/admin/delete/product/:slug_id', function(req, res) {
		var slug_id = req.params.slug_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};

		PieceModel.findOneAndRemove(query, function(err){
			res.redirect('/admin/products');
		});
	});



	// update product
	app.get('/admin/product/:slug_id', function(req, res) {
		var slug_id = req.params.slug_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};

		PieceModel.findOne(query, function(err, piece){
			if (err || !piece) { console.log(err); res.render('404', { user: req.user }); return false; } 
			res.render('admin/product_update', { user: req.user, product: piece });
		});
	});

	// var massageProductData = function(req, res, next){
	// 	var designer = req.body.designer;
	// 	var slug_id = slug(req.body.title + " by " + designer);
	// 	var tags = req.body.tags.split(',');
	// 	tags = _.map(tags, function(tag){ return tag.trim();});
	// 	tags = _.compact(tags);
	// 	var details = _.object(req.body.details.key, req.body.details.value);
	// 	details = _.map(details, function(v,k){ return {'k': k, 'v': v}});
	// 	var shipping = _.object(req.body.shipping.key, req.body.shipping.value);
	// 	shipping = _.map(shipping, function(v,k){ return {'k': k, 'v': v}});

	// 	var data = {
	// 		slug_id: slug_id,
	// 		designer: designer,
	// 		designer_id: designer,
	// 		title: req.body.title,
	// 		group: req.body.group,
	// 		category: req.body.category,
	// 		price: Number(req.body.price),
	// 		description: req.body.description,
	// 		tags: tags,
	// 		details: {
	// 			product: details,
	// 			shipping: shipping
	// 		}
	// 	};

	// 	req.productData = data;
	// 	next();
	// };

	// save updated product
	app.post('/admin/update/product/:slug_id', function(req, res) {
		var slug_id = req.params.slug_id;
		var product = req.body.product;
		
		if(req.user.user_type == 'admin'){
			designer = req.body.designer;
			product = _.pick(product, 'title', 'group', 'category', 'subcategory', 
				'tags', 'description', 'base_price', 'price', 'currency', 'status', 'feature');			
		} else {
			designer = req.user.designer;
			product = _.pick(product, 'title', 'group', 'category', 'subcategory', 
				'tags', 'description', 'base_price', 'price', 'currency');
		}

		// product = _.pick(product, 'title', 'group', 'category', 'subcategory', 'tags', 'description', 'base_price', 'price', 'currency');
		product = _.compactObject(product);
		// var designer = req.user.user_type == 'admin' ? req.body.designer : req.user.designer;

		var errors;
		async.series([
			function(callback) {

				errors = Validator.checkAll(product, {
					title: { 'validator': 'notEmpty', 'error': 'product_title_required'},
					group: { 'validator': 'notEmpty', 'error': 'product_group_required'},
					category: { 'validator': 'notEmpty', 'error': 'product_category_required'},
					// subcategory: { 'validator': 'notEmpty', 'error': 'product_subcategory_required'},
					currency: { 'validator': 'notEmpty', 'error': 'product_currency_required'},
					base_price: { 'validator': 'isDecimal', 'error': 'product_price_required'}
				});

				if( !_.isEmpty(errors) ) { 
					return callback(new Error()); 
				}

				callback();
			},

			// function(callback) {
			// 	product.slug_id = slug(product.title + " by " + req.user.designer);
			// 	PieceModel.findOne({slug_id: product.slug_id}, function(err, piece){
			// 		if(piece) {
			// 			product.slug_id = product.slug_id + "-" + (new Date).getTime().toString(36);
			// 		}
			// 		callback();
			// 	});
			// },

			function(callback) {
				if(product.tags) product.tags = product.tags.split(',');
				if(product.description) product.description = product.description.replace(/\n/g, '<br>');

				PieceModel.findOneAndUpdate({slug_id: slug_id, designer: designer}, {$set: product}, function(err, piece){
					if (err) { callback(new Error()); return false; }
					callback();
				});
			}],

			function(err){
				if(err){
					var message = Errors.getErrorMessages(errors, null);
					res.send(message);
					return false;
				}
				res.status(200)
				res.send({status: 'success', slug_id: slug_id});
			}
		);

	});


	// add product
	app.get('/admin/add/product', function(req, res) {		
		res.render('admin/product_add', {user: req.user});
	});

	// save new product
	app.post('/admin/add/product', function(req, res) {
		var product = req.body.product;
		product = _.pick(product, 'title', 'group', 'category', 'subcategory', 'tags', 'description', 'base_price', 'price', 'currency');
		product = _.compactObject(product);

		var designer = req.user.user_type == 'admin' ? req.body.designer : req.user.designer;

		var errors;
		async.series([
			function(callback) {

				errors = Validator.checkAll(product, {
					title: { 'validator': 'notEmpty', 'error': 'product_title_required'},
					group: { 'validator': 'notEmpty', 'error': 'product_group_required'},
					category: { 'validator': 'notEmpty', 'error': 'product_category_required'},
					// subcategory: { 'validator': 'notEmpty', 'error': 'product_subcategory_required'},
					currency: { 'validator': 'notEmpty', 'error': 'product_currency_required'},
					base_price: { 'validator': 'isDecimal', 'error': 'product_price_required'}
				});

				if( !_.isEmpty(errors) ) { 
					return callback(new Error()); 
				}

				callback();
			},

			function(callback) {
				product.slug_id = slug(product.title + " by " + designer);
				
				PieceModel.findOne({slug_id: product.slug_id}, function(err, piece){
					if(piece) {
						product.slug_id = product.slug_id + "-" + (new Date).getTime().toString(36);
					}
					callback();
				});
			},

			function(callback) {
				if(product.tags) product.tags = product.tags.split(',');
				product.designer = designer;

				var piece = new PieceModel(product);
				piece.save(function (err) {
					if (err) { console.log(err); return callback(err); }
					callback();
				});

			}],

			function(err){
				if(err){
					var message = Errors.getErrorMessages(errors, null);
					res.send(message);
					return false;
				}
				res.status(200)
				res.send({status: 'success', slug_id: product.slug_id});
			}
		);

	});



	///////////////////////////////////////////////////////////
	/////////    manage product images    /////////////////
	///////////////////////////////////////////////////////////
	app.get('/admin/product-images/:slug_id', function(req, res) {
		var slug_id = req.params.slug_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};

		PieceModel.findOne(query, function(err, piece){
			if (err || !piece) { console.log(err); res.render('404', { user: req.user }); return false; } 
			res.render('admin/product_images', { user: req.user, product: piece });
		});
	});

	app.post('/admin/product-image-upload/:slug_id', function(req, res) {
		var slug_id = req.params.slug_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};
		
		cloudinary.cloudinary.uploader.upload(req.files.file.path, function(result) {   			
  			if(!result || !result.public_id) { res.status(500); res.send(500); return false; }

  			var image = {
  				public_id: result.public_id,
  				format: result.format,
  				width: result.width,
  				height: result.height
  			};

  			PieceModel.findOneAndUpdate(query, {$push: {"cloudinary.images": image}}, {upsert:true}, function(err, piece){
				if (err || !piece) { console.log(err); res.status(404); res.send(404); return false; } 
				res.status(200); res.send(200);
			});
  			
		});

	});

	app.post('/admin/product-image-remote-upload/:slug_id', function(req, res) {
		var remoteImageUrl = req.body.remoteImageUrl;

		console.log(remoteImageUrl);

		var slug_id = req.params.slug_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};
		
		if(_.isEmpty(remoteImageUrl)) {
			res.send({status: 'error', messages: 'Remote Url is missing.'});
			return false;
		}

		cloudinary.cloudinary.uploader.upload(remoteImageUrl, function(result) {   			
  			if(!result || !result.public_id) { res.status(500); res.send(500); return false; }

  			var image = {
  				public_id: result.public_id,
  				format: result.format,
  				width: result.width,
  				height: result.height
  			};

  			PieceModel.findOneAndUpdate(query, {$push: {"cloudinary.images": image}}, {upsert:true}, function(err, piece){
				if (err || !piece) { console.log(err); res.status(404); res.send(404); return false; } 
				res.status(200);
				res.send({status: 'success', slug_id: piece.slug_id});
			});
  			
		});

	});

	app.get('/admin/product-image-remove/:slug_id/:public_id', function(req, res){
		var slug_id = req.params.slug_id;
		var public_id = req.params.public_id;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};

		PieceModel.findOneAndUpdate(query, {$pull: {"cloudinary.images": {"public_id": public_id}}}, function(err, piece){
			if (err || !piece) { console.log(err); res.status(404); res.send(404); return false; } 
			res.redirect('/admin/product-images/' + slug_id);
		});

		cloudinary.cloudinary.uploader.destroy(public_id, function(result) {} );
	});

	app.get('/admin/product-image-cover/:slug_id/:cover', function(req, res){
		var slug_id = req.params.slug_id;
		var cover = req.params.cover;
		var query = req.user.user_type == 'admin' ? {slug_id: slug_id} : {slug_id: slug_id, designer: req.user.designer};

		PieceModel.findOneAndUpdate(query, {$set: {"cloudinary.cover": cover}}, function(err, piece){
			if (err || !piece) { console.log(err); res.status(404); res.send(404); return false; } 
			res.redirect('/admin/product-images/' + slug_id);
		});
	});



	///////////////////////////////////////////////////////////
	/////////    super admin access only    /////////////////
	///////////////////////////////////////////////////////////

	app.post('/admin/designer/add', function(req, res){
		var designer = new Designer({
			_id: req.body._id,
			name: req.body.name,
			title: req.body.title,
			country: req.body.country,
			profile: req.body.profile,
			avatar: {
				small: req.body.avatar.small,
				large: req.body.avatar.large
			}
		});

		designer.save(function(err){
			if (err) { console.log(err); res.render('500', { user: req.user }); return false; }
			res.redirect('/admin/designers');
		});
	});


	app.post('/admin/designer/update', function(req, res){
		var _id = req.body._id;
		var data = {
			name: req.body.name,
			title: req.body.title,
			country: req.body.country,
			profile: req.body.profile,
			avatar: {
				small: req.body.avatar.small,
				large: req.body.avatar.large
			}
		};
		
		Designer.findOneAndUpdate({_id: _id}, {$set: data}, function(err, designer){
			if (err) { console.log(err); res.render('500', { user: req.user }); return false; }
			res.redirect('/admin/designers');
		});
	});


	app.get('/admin/designers', function(req, res) {
		Designer.find(function(err, designers) {
			if (err){
				console.log(err);
				res.render('500', { user: req.user }); return false;
			}
			res.render('admin/designers', {designers: designers});	
		});
	});

	app.get('/admin/users', function(req, res) {
		User.find( function (err, users) {
		  if (err) { console.log(err); res.render('500', { user: req.user }); return false; } 
		  res.render('admin/users', { users: users });
		});
	});




	///////// Manage Category ////////////

	app.get('/admin/categories', function(req, res) {
		Category.find(function(err, categories) {
			res.render('admin/manage_categories', {categories: categories});	
		});
	});

	app.post('/admin/category/add', function(req, res){
		var data = req.body.category;
		data.sub_categories = data.sub_categories.split(',');
		var category = new Category(data);
		category.save(function(err){
			res.redirect('/admin/categories');
		});
	});

	app.post('/admin/category/update', function(req, res){
		var data = req.body.category;
		data.sub_categories = data.sub_categories.split(',');
		console.log(data)
		Category.findOneAndUpdate({slug_id: data.slug_id}, {$set: data}, function(err,category){
			res.redirect('/admin/categories');
		});
	});

	app.get('/api/category/:category', function(req, res){
		Category.findOne({slug_id: req.params.category}, function(err, category){
			res.send(category);
		});
	});

	app.get('/api/subcategories/:category', function(req, res){
		Category.findOne({slug_id: req.params.category}, function(err, category){
			if(category && category.sub_categories){
				Category.find({slug_id: {$in: category.sub_categories} },'slug_id name url icon image', function(err, subcategories){
					res.send(subcategories);
				});	
			} else {
				res.status(404);
				res.send(404);
			}
		});
	});



	///////////////////////////////////////////////////////////
	/////////    Ajax APIs (no permission)    /////////////////
	///////////////////////////////////////////////////////////
	app.get('/api/designer/:designer', function(req, res) {
		var _id = req.params.designer;
		Designer.findOne({_id: _id}, function(err, designer) {
			if (err){ console.log(err); }
			res.send(designer);	
		});
	});


};