// require('newrelic');

var express = require('express'),
	settings = require('./settings'),
	db = require('./db'),
	MongoStore = require('connect-mongo')(express),	
	passport = require('passport'),

	pieces = require('./routes/pieces'),
	
	engine = require('ejs-locals'),
	User = require('./models/user'),
	
	flash = require('connect-flash'),
	_ = require('underscore');


var app = express();
app.configure(function () {
	//app.use(express.logger('dev'));
	app.engine('ejs', engine);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'ejs');

	app.set('emails', __dirname + '/public/emails');
	
	app.use(express.cookieParser());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.session({ secret: settings.cookieSecret, store: new MongoStore({url: settings.db})}));
	// Initialize Passport!  Also use passport.session() middleware, to support
	// persistent login sessions (recommended).
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(flash());

	app.locals.cart_size = 0;
	app.use(function(req, res, next){
		res.locals.user = req.user;
		// res.locals.authenticated;
		if (req.session.cart) {
			app.locals.cart_size = _.size(req.session.cart);
		}
		next();
	});

	app.use(app.router);
	app.use(express.static(__dirname + '/public'));


	// Page not found handler
	app.use(function(req, res, next){
		console.log(req.url, 'not found');
		if(req.xhr) {
			res.send(404);
		} else {
			res.render('404', {status: 404, user: req.user}); //{ status: 404, url: req.url }
		}
	});
	// Error handler
	app.use(function(err, req, res, next){
		console.log(err.stack);
		if(req.xhr) {
			res.send(500, {error: err.stack});
		} else {
			res.render('500', {status: err.status || 500, user: req.user});
		}
	});

});


require('./routes/index')(app),

require('./routes/user')(app);
require('./routes/user-panel')(app);
require('./routes/pieces')(app);
require('./routes/admin')(app);
require('./routes/cart')(app);
require('./routes/checkout')(app);


var port = process.env.PORT || 8080;
app.listen(port);
console.log('Web server is running on port ', port);
