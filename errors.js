var _ = require('underscore');

var errors = {
	user_login_error: "Oops, it seems that your username or password is incorrect.",
	
	/* user sign up, account settings */
	invalid_userid_error: "Please enter a valid email address.",
	invalid_email_error: "Please enter a valid email address.",
	invalid_password_error: "Please enter a password.",
	invalid_name_error: "Please enter your full name.",
	user_exists_error: "Oops, it looks like the email address belongs to an existing account. Please choose another email to sign up.",
	email_exists_error: "Oops, it looks like the email address belongs to an existing account. Please choose another email.",
	signup_success: "Thanks very much for your signing up with us. Your account has been created successfully. <a class='link' href='/login'>Login now</a> to start shopping!",

	/* forgot password */
	forgot_password_email_sent: "A reset password email will be sent to your email box in a short while. If you didn't receive the email, please kindly check your spam box. Otherwise, you can click <a class='link' href='/forgot-password'>here</a> to submit the forgot password request again.",
	forgot_password_user_nonexistence_error: "Oops, it seems that the email you just entered hasn't been registered with us. Please check it again.",
	reset_password_invalid_token: "Oops, it seems that the reset password token is invalid.",
	reset_password_success: "Your password has been reset. <a class='link' href='/login'>Login now</a>.",

	// user panel
	user_profile_save_success: "Your profile is updated.",
	user_account_save_success: "Your account is updated.",

	current_password_error: "Please enter your current password.",
	new_password_error: "Please enter a new password.",
	invalid_current_password_error: "Your current password is incorrect.",
	new_password_save_success: "Your password is updated.",

	/* cart */
	// add_to_cart_success: '<a href="/checkout">The item is added to your shopping cart.<br><i class="fa fa-shopping-cart"></i> Checkout Now</a>',
	// add_to_cart_fail: 'Sorry, our server has encountered a problem when processing your request. Please try it again later.',

	/* billing & shipping */
	billing_name_required: "Please enter your Name.",
	billing_address_required: "Please enter your Address.",
	billing_city_required: "Please enter your City.",
	billing_country_required: "Please enter your Country.",
	billing_postalcode_required: "Please enter Postal Code.",
	billing_phone_required: "Please enter your Phone Number.",
	billing_email_required: "Please enter a valid Email Address.",

	//add product
	product_title_required: "Please input the product title.",
	product_group_required: "Please select group.",
	product_category_required: "Please select category.",
	product_subcategory_required: "Please select sub category.",
	product_currency_required: "Please select currency code.",
	product_price_required: "Please input the product price."

};


var getErrorMessage = function getErrorMessage(errorCode){
	var message = errors[errorCode];
	if(!message){
		message =  errorCode
	}
	return message;
};

exports.getErrorMessage = getErrorMessage;

exports.getErrorMessages = function getErrorMessages(errors, messages){
	if(!_.isEmpty(errors)){
		errors = _.map(errors, function(err){ return getErrorMessage(err); });
		return {status: 'error', messages: errors.join('<br>')};
	}
	if(!_.isEmpty(messages)){
		messages = _.map(messages, function(err){ return getErrorMessage(err); });
		return {status: 'success', messages: messages.join('')};
	}
	return null;
};
