var User = require('../models/user');
var Validator = require('../validator');
var _ = require('../underscore-extend');
var Errors = require('../errors');
var async = require('async');
var bcrypt = require('bcrypt');


module.exports = function(app) {

	// permission controllers
	app.all('/u(/*)?', function(req, res, next) {
		if (!req.user) {
			res.redirect('/login');
			return false;
		}
		next();
	});

	app.get('/u/:tab(account)?', function(req, res){	
		var message = Errors.getErrorMessages(req.flash('errors'), req.flash('messages'));
		res.render('user/user-panel', {user: req.user, 
			tab: 'account', 
			message: message });
	});

	app.get('/u/profile', function(req, res){	
		var message = Errors.getErrorMessages(req.flash('errors'), req.flash('messages'));
		var profile = req.session.profile;
		if(!profile) profile = _.pick(req.user, 'displayName', 'email', 'title', 'address', 'phone');

		res.render('user/user-panel', {user: req.user, 
			profile: profile,
			tab: 'profile', 
			message: message });
	});

	app.post('/u/profile/update', function(req, res){
		var profile = req.body.profile;
		profile = _.pick(profile, 'displayName', 'email', 'title', 'address', 'phone');

		var errors = Validator.checkAll(profile, {
			displayName: { 'validator': 'notEmpty', 'error': 'invalid_name_error'},
			email: { 'validator': 'isEmail', 'error': 'invalid_email_error'}
		});

		if(!_.isEmpty(errors)){
			req.flash('errors', errors);
			req.session.profile = profile;
			res.redirect('/u/profile');
			return false;
		}

		User.findOneAndUpdate({user_id: req.user.user_id, provider: req.user.provider}, 
			{$set: profile}, function(err, user){
			if(err) { console.log(err); }
			req.flash('messages', 'user_profile_save_success');
			if(req.session.profile) delete req.session['profile'];
			res.redirect('/u/profile');
		});
	});

	app.post('/u/account/update', function(req, res){
		var account = req.body.account;
		account = _.pick(account, 'currentPassword', 'password');
		account = _.compactObject(account);

		async.series([
			function(callback) {

				var errors = Validator.checkAll(account, {
					currentPassword: { 'validator': 'notEmpty', 'error': 'current_password_error'},
					password: { 'validator': 'notEmpty', 'error': 'new_password_error'}
				});

				if( !_.isEmpty(errors) ) { 
					req.flash('errors', errors); 
					return callback(new Error()); 
				}

				callback();
			},

			function(callback) {
				User.findOne({ user_id: req.user.user_id, provider: 'local' }, function (err, user) {
					if (err) { console.log(err); }
					if (!user) { return callback(new Error()); }
					bcrypt.compare(account.currentPassword, user.password, function(err, res) {
						if (err) { console.log(err); }
						if (res == false) {
							req.flash('errors', 'invalid_current_password_error'); 
							return callback(new Error()); 
						}

						bcrypt.hash(account.password, 8, function(err, hash) {
							if(err) { console.log(err); }
							user.password = hash;
							user.save(function(err){
								if(err) { console.log(err);}
								callback();
							});
						});

					});
					
				});
			}],

			function(err){
				if(!err) req.flash('messages', 'new_password_save_success'); 
				res.redirect('/u/account');
			}
		);

	});

}