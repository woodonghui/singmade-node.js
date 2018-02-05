/* checkout router */
var PieceModel = require('../models/piece');
var _ = require('underscore');
var Validator = require('../validator');
var Errors = require('../errors');
var async = require('async');

var ec = require('../paypal-express-checkout');


module.exports = function(app) {
	
	app.get('/checkout', function(req, res){
		res.redirect('/cart');
	});
	
	app.get('/checkout/login', function(req, res){
		if (req.user) {
			res.redirect('/checkout/billing-and-shipping');
			return false;
		}
		res.render('checkout/checkout_login');
	});
	
	app.get('/checkout/guest', function(req, res) {
		req.session.user = {provider: 'anonymous'};
		res.redirect('/checkout/billing-and-shipping');
	});
	
	app.get('/checkout/billing-and-shipping', function(req, res) {
		if (!req.user && !req.session.user) {
			res.redirect('/checkout/login');
			return false;
		} 
		res.render('checkout/billing');
	});
	
	app.post('/checkout/billing', function(req, res) {
		var billing = req.body.billing;
		billing = _.pick(billing, 'name', 'address', 'city', 'country', 'address2', 'postalcode', 'phone', 'email');
		billing = _.compactObject(billing);
		console.log(billing);
		
		var errors;
		async.series([
			function(callback) {
				errors = Validator.checkAll(billing, {
					name: { 'validator': 'notEmpty', 'error': 'billing_name_required'},
					address: { 'validator': 'notEmpty', 'error': 'billing_address_required'},
					city: { 'validator': 'notEmpty', 'error': 'billing_city_required'},
					country: { 'validator': 'notEmpty', 'error': 'billing_country_required'},
					postalcode: { 'validator': 'notEmpty', 'error': 'billing_postalcode_required'},
					phone: { 'validator': 'isDecimal', 'error': 'billing_phone_required'},
					email: { 'validator': 'isDecimal', 'error': 'billing_email_required'}
				});

				if( !_.isEmpty(errors) ) { 
					return callback(new Error()); 
				}
				callback();
			}],

			function(err){
				if(err){
					var message = Errors.getErrorMessages(errors, null);
					res.send(message);
					return false;
				}
				req.session.billing = billing;
				res.status(200)
				res.send({status: 'success'});
			}
		);
		
	});


	// app.get('/checkout/payment', function(req, res){
	// 	// if (_.isEmpty(req.session.cart) || _.isEmpty(req.session.billing)) {
	// 	// 	res.redirect('/cart');
	// 	// 	return false;
	// 	// }
	// 	res.render('checkout/payment');
	// });


	app.get('/checkout/payment', function(req, res){

		console.log(req.session.cart);

		var cart = req.session.cart;
		if ( !cart || _.isEmpty(cart) ){
			res.redirect('/cart');
		}

		cart = _.values(cart);

		var sum = _.reduce(cart, function(total, item){ return total + item.price*item.amount; }, 0);
		
		var payment = {
			RETURNURL: 'http://www.singmade.com/checkout/payment/return',
			CANCELURL: 'http://www.singmade.com/checkout/payment/cancel',
			BRANDNAME: 'www.singmade.com',
			SOLUTIONTYPE: 'sole',
			// PAYMENTREQUEST_0_DESC: 'Description',
			PAYMENTREQUEST_0_CURRENCYCODE: 'SGD',
			PAYMENTREQUEST_0_PAYMENTACTION: 'Sale',
			PAYMENTREQUEST_0_AMT: String(sum)
		};

		_.each(cart, function(el, index, list){
			console.log(el);
			var item = {};
			item['L_PAYMENTREQUEST_0_ITEMCATEGORY'+index] = 'Physical';
			item['L_PAYMENTREQUEST_0_NAME'+index] = el.title;
			item['L_PAYMENTREQUEST_0_AMT'+index] = el.price;
			item['L_PAYMENTREQUEST_0_QTY'+index] = el.amount;
			_.extend(payment, item);
		});

		ec.set(payment, function (err, data){
			if(err) return next(err);
			req.session.payment = payment;
		    res.redirect(data.PAYMENTURL);
		});

	});



// { TOKEN: 'EC-98162243ES026460R',
//   SUCCESSPAGEREDIRECTREQUESTED: 'true',
//   TIMESTAMP: '2013-12-31T04:21:34Z',
//   CORRELATIONID: '75cbdd4190853',
//   ACK: 'Success',
//   VERSION: '92.0',
//   BUILD: '8951431',
//   INSURANCEOPTIONSELECTED: 'false',
//   SHIPPINGOPTIONISDEFAULT: 'false',
//   PAYMENTINFO_0_TRANSACTIONID: '4C761781G8092293P',
//   PAYMENTINFO_0_RECEIPTID: '5167-6315-7549-2368',
//   PAYMENTINFO_0_TRANSACTIONTYPE: 'cart',
//   PAYMENTINFO_0_PAYMENTTYPE: 'instant',
//   PAYMENTINFO_0_ORDERTIME: '2013-12-31T04:21:34Z',
//   PAYMENTINFO_0_AMT: '600.00',
//   PAYMENTINFO_0_FEEAMT: '23.90',
//   PAYMENTINFO_0_TAXAMT: '0.00',
//   PAYMENTINFO_0_CURRENCYCODE: 'SGD',
//   PAYMENTINFO_0_PAYMENTSTATUS: 'Completed',
//   PAYMENTINFO_0_PENDINGREASON: 'None',
//   PAYMENTINFO_0_REASONCODE: 'None',
//   PAYMENTINFO_0_PROTECTIONELIGIBILITY: 'PartiallyEligible',
//   PAYMENTINFO_0_PROTECTIONELIGIBILITYTYPE: 'ItemNotReceivedEligible',
//   PAYMENTINFO_0_SECUREMERCHANTACCOUNTID: 'VQ2Q5LQ6DKW6J',
//   PAYMENTINFO_0_ERRORCODE: '0',
//   PAYMENTINFO_0_ACK: 'Success' }


	app.get('/checkout/payment/return', function(req, res, next){

		var payment = req.session.payment;
		if ( !payment || _.isEmpty(payment) ){
			res.redirect('/cart');
		}

		_.extend(payment, {
			TOKEN: req.query.token,
			PAYERID: req.query.PayerID
		});

		ec.do_payment(payment, function (err, data){
			if( err ) return next( err );
			console.log(data);

			res.redirect('/');
		});

	});

	app.get('/checkout/payment/cancel', function(req, res, next){
		res.redirect( '/cart');
	});


};


