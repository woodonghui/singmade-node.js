/* user router */
var settings = require('../settings');
var async = require('async');
var User = require('../models/user');
var Validator = require('../validator');
var _ = require('underscore');
var Errors = require('../errors');
var bcrypt = require('bcrypt');
var email = require('../email');
var ResetPasswordToken = require('../models/reset-password-token');

var	LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var SinaStrategy = require('passport-sina').Strategy;
var passport = require('passport');


passport.serializeUser(function(user, done) {
	done(null, user.id);
});

passport.deserializeUser(function(id, done) {
	User.findById(id, function(err, user){
		if(err) { return done(err); }
		if(user) {return done(null, user); }
	});
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		process.nextTick(function () {
			User.findOne({ user_id: username.toLowerCase(), provider: 'local' }, function (err, user) {
				if (err) { console.log(err); return done(err); }
				else if (!user) { return done(null, false, {message: 'user_login_error'}); }
				else {
					bcrypt.compare(password, user.password, function(err, res) {
						if (err) { console.log(err); return done(err); }
						else if (res == false) { return done(null, false, {message: 'user_login_error'}); }
						else {
							return done(null, user);
						}
					});
				}
			});
		});
	}
));

passport.use(new FacebookStrategy({
    clientID: settings.facebookAppId,
    clientSecret: settings.facebookAppSecret,
    callbackURL: "http://www.singmade.com/auth/facebook/callback",
	profileFields: ['provider', 'id', 'name', 'displayName', 'photos', 'emails']
  },
  function(accessToken, refreshToken, profile, done) {	
    // asynchronous verification, for effect...
    process.nextTick(function () {
    	console.log(profile);
		User.findOne({ provider: profile.provider, user_id: profile.id}, function(err, user){
			if(err) { return done(err); }
			if(user) { return done(null, user); }
			
			user = new User({
				provider: profile.provider, 
				user_id: profile.id,
				displayName: profile.displayName,
				email: profile.email,
				profile_image_url: "http://res.cloudinary.com/boutiquesg/image/facebook/w_25,h_25,c_fill/" + profile.id + ".jpg"
			});
			
			user.save(function(err) {
				if (!err) {
					return done(null, user);
				} else {
					return done(err)
				}
			});
			
		});
    });
  }
));


passport.use(new TwitterStrategy({
    consumerKey: settings.twitterConsumerKey,
    consumerSecret: settings.twitterConsumerSecret,
    callbackURL: "http://www.singmade.com/auth/twitter/callback",
	profileFields: ['provider', 'id', 'name', 'displayName', 'photos', 'emails']
  },
  function(token, tokenSecret, profile, done) {
    process.nextTick(function () {

    	console.log(profile);
	
		User.findOne({ provider: profile.provider, user_id: profile.id}, function(err, user){
			if(err) { return done(err) }
			
			if(user) { return done(null, user) }
			
			user = new User({
				provider: profile.provider, 
				user_id: profile.id,
				displayName: profile.displayName,
				email: profile.email,
				profile_image_url: "http://res.cloudinary.com/boutiquesg/image/twitter/w_25,h_25,c_fill/" + profile.id + ".jpg"
			});
			
			user.save(function(err) {
				if (!err) {
					return done(null, user)
				} else {
					return done(err)
				}
			});
			
		});
	});
  }
));


passport.use(new SinaStrategy({
		clientID: settings.sinaClientID,
    	clientSecret: settings.sinaClientSecret,
    	callbackURL: "http://www.singmade.com/auth/sina/callback",
    	requireState: false
	},
	function(token, tokenSecret, profile, done) {
		process.nextTick(function () {
			console.log(profile);

			User.findOne({ provider: profile.provider, user_id: profile.id}, function(err, user){
				if(err) { return done(err) }
				if(user) { return done(null, user) }
				
				user = new User({
					provider: profile.provider, 
					user_id: profile.id,
					displayName: profile.name,
					email: profile.email,
					profile_image_url: profile.profile_image_url
				});
				
				user.save(function(err) {
					if (!err) {
						return done(null, user)
					} else {
						return done(err)
					}
				});
				
			});

    	});
	}
));

module.exports = function(app) {

	app.get('/forgot-password', function(req, res) {
		var errors = _.map(req.flash('errors'), function(err){ return Errors.getErrorMessage(err); });
		res.render('user/forgot-password', { user: req.user, errors: errors.join(',') } );
	});

	app.post('/retrieve-password', function(req, res) {
		var username = req.body.username ? req.body.username.trim().toLowerCase() : '';
		var errors;
		var theUser;
		var theToken;

		async.series([
			function(callback) {
				var validator = new Validator();
				validator.check(username, 'invalid_userid_error').isEmail();
				errors = validator.getErrors();
				if( !_.isEmpty(errors) ) { return callback(new Error()); }
				callback();
			},

			function(callback) {
				User.findOne({ user_id: username, provider: 'local' }, function (err, user) {
					if(!user) {
						errors = ['forgot_password_user_nonexistence_error'];
						return callback(new Error());
					}
					theUser = user;
					callback();
				});
			},

			function(callback) {
				bcrypt.hash(theUser.user_id, 8, function(err, hash) {
					var token = new ResetPasswordToken({
						user_id: theUser.user_id,
						token: hash
					});
					theToken = hash;
					token.save(function(err){
						if(err) { return callback(new Error()); }
						callback();
					});
				});	
			},

			function(callback) {
				var fs = require('fs');
				fs.readFile(app.get('emails') + '/reset-password.html', 'utf8', function(err, data){
					if (err) { return callback(new Error()); }
					var template = _.template(data);
					var html = template({displayName: theUser.displayName, token: theToken});
					email.send(theUser.email, "Reset password", html);
					callback();
				});
			}
		], 

		function(err){
			if(err){
				req.flash('errors', errors);
				res.redirect('/forgot-password');	
			} else {
				req.flash('messages', 'forgot_password_email_sent'); 
				res.redirect('/success-message');
			}
		});

	});

	app.get('/success-message', function(req, res) {
		var messages = _.map(req.flash('messages'), function(msg){ return Errors.getErrorMessage(msg); });
		res.render('user/redirect-message', { user: req.user, messages: messages.join(',') } );
	});

	
	app.get('/reset-password', function(req, res) {
		var token = req.query.token;
		var errors = _.map(req.flash('errors'), function(err){ return Errors.getErrorMessage(err); });
		res.render('user/reset-password', {user: req.user, token: token, errors: errors.join(',') });
	});	

	app.post('/generate-new-password', function(req, res) {
		var password = req.body.password;
		var token = req.body.token;
		var user_id;
		var errors;

		async.series([
			function(callback) {
				var validator = new Validator();
				validator.check(password, 'invalid_password_error').notEmpty();
				errors = validator.getErrors();
				if( !_.isEmpty(errors) ) { return callback(new Error()); }
				callback();
			},

			function(callback) {
				ResetPasswordToken.findOneAndUpdate({token: token, expired: false}, {$set: { expired: true }}, function(err, theToken){
					if(err) { console.log(err); return callback(err); }
					if(!theToken) { errors = ['reset_password_invalid_token']; return callback(new Error()); }
					user_id = theToken.user_id;
					callback();
				});
			},

			function(callback) {
				User.findOne({user_id: user_id, provider: 'local'}, function(err, user){
					if(err) { console.log(err); return callback(err); }
					if(!user) { return callback(new Error()); }
					bcrypt.hash(password, 8, function(err, hash) {
						if(err) { console.log(err); return callback(err); }
						user.password = hash;
						user.save(function(err){
							if(err) { console.log(err); return callback(err); }
							callback();
						});
					});

				});
			}
		],

		function(err){
			if(err){
				req.flash('errors', errors);
				res.redirect('/reset-password'); 
			}else{
				req.flash('messages', 'reset_password_success'); 
				res.redirect('/success-message');
			}
		});

	});
	
	app.post('/create-user', function(req, res) {
		
		var userForm = {
			userId: req.body.user.userId,
			displayName: req.body.user.displayName
		};
		
		var validator = new Validator();
		validator.check(userForm.userId, 'invalid_userid_error').isEmail();
		validator.check(userForm.displayName, 'invalid_name_error').notEmpty();
		validator.check(req.body.user.password, 'invalid_password_error').notEmpty();
		var errors = validator.getErrors();
		
		if( !_.isEmpty(errors) ){ 
			req.flash('errors', errors);
			req.session.userForm = userForm;
			res.redirect('/signup');	
			return false;	
		}

		var theUser;
		async.series(
			[
				// check whether user exists?
				function(callback) {
					User.ifUserExist(userForm.userId, function(err, user){
						if(err) { console.log(err); return callback(err); }
						if(user) { return callback(new Error('user_exists_error')); }
						callback();
					});
				},
				
				//create new user
				function(callback) {
					bcrypt.hash(req.body.user.password, 8, function(err, hash) {
						if (err) { console.log(err); return callback(err); }
						else {
							user = new User({
								email: userForm.userId,
								user_id: userForm.userId,
								password: hash,
								displayName: userForm.displayName
							});

							user.save(function(err) {
								if (err) { console.log(err); return callback(err); }
								else {
									theUser = user;
									return callback();
								}
							});
						}
					});
				},

				function(callback) {
					var fs = require('fs');
					fs.readFile(app.get('emails') + '/welcome.html', 'utf8', function(err, data){
						if (err) { return callback(new Error()); }
						var template = _.template(data);
						var html = template({displayName: theUser.displayName});
						email.send(theUser.email, "Welcome to join singmade.com", html);
						callback();
					});
				}
			], 
		
			function(err) {
				if(err){						
					if (err.message === 'user_exists_error') {
						req.flash('errors', err.message);
						req.session.userForm = userForm;
						res.redirect('/signup');
					} else {
						res.render('500', {user: null});
					}
					return false;
				}

				if (req.session.userForm) delete req.session['userForm'];
				req.flash('messages', 'signup_success'); 
				res.redirect('/success-message');
				
			}
		);
		
	});
	
	
	app.get('/signup', function(req, res) {
		if(req.user){ res.redirect('/'); } 
		else {
			var errors = _.map(req.flash('errors'), function(err){ return Errors.getErrorMessage(err); });
			var userForm = req.session.userForm;
			res.render('user/signup', { user: req.user, userForm: userForm, errors: errors.join('<br/>') });
		}
	});
	
	app.get('/login', function(req, res){
		if(req.user){ res.redirect('/'); } 
		else {
			var errors = _.map(req.flash('error'), function(err){ return Errors.getErrorMessage(err); });
			var messages = req.flash('signup_success').join('');
			var username = req.flash('username').join('');
			res.render('user/login', { user: req.user, username: username, messages: messages, errors: errors.join('<br/>') });
		}
	});

	app.get('/oauth-complete', function(req, res){
		var errors = _.map(req.flash('errors'), function(err){ return Errors.getErrorMessage(err); });
		res.render('user/signup-oauth-complete', {user: req.user, errors: errors.join('<br/>')});
	});

	app.post('/oauth-complete', function(req, res){
		var user = req.user;
		user.email = req.body.user.email;
		user.displayName = req.body.user.displayName;
		
		var validator = new Validator();
		validator.check(user.email, 'invalid_email_error').isEmail();
		validator.check(user.displayName, 'invalid_name_error').notEmpty();
		var errors = validator.getErrors();
		
		if( !_.isEmpty(errors) ){ 
			req.flash('errors', errors);
			res.redirect('/oauth-complete');	
			return false;	
		}

		async.series(
			[
				function(callback) {
					User.findOneAndUpdate({user_id: user.user_id, provider: user.provider}, 
						{$set: { email: user.email, displayName: user.displayName }}, 
						function(err, user){
							if(err) { console.log(err); return callback(err); }
							callback();
					});
				},

			],

			function(err) {
				if(err) { res.render('500', {user: null}); return false; }
				res.redirect('/');	
			}
		);
		
	});

	//app.post('/auth', passport.authenticate('local', { successRedirect: '/', failureRedirect: '/login', failureFlash: true }));
	app.post('/auth', function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err); }
			if (!user) {
				req.flash('error', info.message);
				req.flash('username', req.body.username);
				return res.redirect('/login');
			}
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				return res.redirect('/');
			});
		})(req, res, next);
	});

	app.get('/auth/(facebook|twitter|sina)', function(req, res, next) {
		var redirect_uri = req.query.redirect_uri;
		if ( !redirect_uri ) {
			req.session.redirect_uri = "/";
		}else {
			req.session.redirect_uri = "/" + redirect_uri;
		}
		next();
	});

	app.get('/auth/facebook', passport.authenticate('facebook'));
	app.get('/auth/facebook/callback',  passport.authenticate('facebook', { failureRedirect: '/login' }),
		function(req, res) {
			if (!req.user.email || !req.user.displayName) {
				res.redirect('/oauth-complete');
			} else {
				var redirect_uri = req.session.redirect_uri;
				res.redirect(redirect_uri || '/');
			}
		}
	);

	app.get('/auth/twitter', passport.authenticate('twitter'));
	app.get('/auth/twitter/callback',  passport.authenticate('twitter', { failureRedirect: '/login' }),
	  	function(req, res) {
			if (!req.user.email || !req.user.displayName) {
				res.redirect('/oauth-complete');
			} else {
				var redirect_uri = req.session.redirect_uri;
				res.redirect(redirect_uri || '/');
			}
		}
	);

	app.get('/auth/sina', passport.authenticate('sina'));
	app.get('/auth/sina/callback',  passport.authenticate('sina', { failureRedirect: '/login' }),
	  	function(req, res) {
			if (!req.user.email || !req.user.displayName) {
				res.redirect('/oauth-complete');
			} else {
				var redirect_uri = req.session.redirect_uri;
				res.redirect(redirect_uri || '/');
			}
		}
	);
	
	app.get('/logout', function(req, res){req.logout(); res.redirect('/');});
	
};