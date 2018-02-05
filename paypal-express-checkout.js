var PayPalEC = require('paypal-ec');

var cred = {
	username: 'donghui-facilitator_api1.singmade.com',
	password: '1387634911',
	signature: 'AFcWxV21C7fd0v3bYYYRCpSSRl31Aq5E0lN1yji3LbIkgRr7ttyoxoLs'
};

var opts = {
	sandbox: true,
	version: '92.0'
};

var ec = new PayPalEC(cred, opts);
module.exports = ec;
