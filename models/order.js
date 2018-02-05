var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({

	billing: {
		name: { type: String, trim: true, required: true },
		address: { type: String, trim: true, required: true },
		city: { type: String, trim: true, required: true },
		country: { type: String, trim: true, required: true },
		address2: { type: String, trim: true },
		postal_code: { type: String, trim: true, required: true },
		phone: { type: String, trim: true, required: true },
		email: { type: String, trim: true, lowercase: true, required: true }
	},
	shipping: {
		name: { type: String, trim: true, required: true },
		address: { type: String, trim: true, required: true },
		city: { type: String, trim: true, required: true },
		country: { type: String, trim: true, required: true },
		address2: { type: String, trim: true },
		postal_code: { type: String, trim: true, required: true },
		phone: { type: String, trim: true, required: true },
		email: { type: String, trim: true, lowercase: true, required: true }
	},

		
	grand_total: { type: Number, required: true },
	items: [],
	
	//voucher_code: { type: String, required: false },
	//discount_code: { type: String, required: false },
	
	order_date: { type: Date, default: Date.now }
	//status: { type: String, required: false },
	//payment_method: { type: String, required: false }
	
});

module.exports = mongoose.model('Order', schema);
