var _ = require('underscore');
var async = require('async');
var PieceModel = require('../models/piece');
var sanitize = require('validator').sanitize;

module.exports = function(app) {

	app.get('/cart/add/:slug', function(req, res){

		var cart = req.session.cart || {};
		var slug = req.params.slug;

		PieceModel.findOne({slug_id: slug}, 'slug_id title price selections cloudinary', function(err, piece){
			if(err) { res.status(404); res.send(404); return false;}
			
			if( !_.isEmpty(piece.selections) ){
				if(!req.query.selection){
					var message = 'Please choose ' + piece.selections.name;
					res.status(200); res.send(200, {error: true, message: message}); return false;
				}
				slug = slug + "-" + req.query.selection;
			}

			if (!cart[slug]){
				cart[slug] = {
					'cart_id': slug,
					'slug_id': piece.slug_id,
					'selection': req.query.selection,
					'amount': 1,
					'title': piece.title,
					'price': piece.price,
					'thumbnail': piece.thumbnail_image.url
				};
			}else{
				cart[slug]['amount'] += 1;
			}
			req.session.cart = cart;
			res.status(200);
			res.send(200);
		});
	});


	app.get('/cart/update/:slug/:amount', function(req, res){
		if (req.session.cart){
			var slug = req.params.slug;
			var amount = sanitize(req.params.amount).toInt();
			
			if(amount > 0) {
				if (req.session.cart[slug]){
					req.session.cart[slug]['amount'] = amount;
				}
			}
		}
		res.redirect('/cart');
	});

	app.get('/cart/remove/:slug', function(req, res){
		if (req.session.cart){
			var slug = req.params.slug;
			if (req.session.cart[slug]){
				delete req.session.cart[slug];
			}
		}
		res.redirect('/cart');
	});

	app.get('/cart/clear', function(req, res){
		delete req.session.cart;
		res.send(req.session.cart);
	});

	app.get('/cart/show', function(req, res){
		res.send(req.session.cart);
	});

	app.get('/cart', function(req, res){
		var cart = req.session.cart;
		if ( !cart || _.isEmpty(cart) ){
			res.render('checkout/checkout', {cart: null});
			return false;
		}

		cart = _.values(cart);

		var sum = _.reduce(cart, function(total, item){ return total + item.price*item.amount; }, 0);
		// var order = req.session.order; 
		res.render('checkout/checkout', {cart: cart, total: sum});
		// res.render('checkout/checkout', {cart: cart, total: sum, order: order});		
		
	});

};
