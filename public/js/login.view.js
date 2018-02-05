
(function($){

var LoginView = Backbone.View.extend({
	
	el: "#container",
	
	initialize: function() {
	},
	
	events: {
		"click button#signupSubmit": "submit"
	},
	
	submit: function(){		
	
		var user = {
			userId: $("input#signupEmail").val().trim(),
			password: $("input#signupPassword").val().trim(),
			displayName: $("input#signupFullname").val().trim()
		};
	
		Validator.prototype.error = function (msg) {
			this._errors.push(msg);
			return this;
		}

		Validator.prototype.getErrors = function () {
			return this._errors;
		}

		var validator = new Validator();
		validator.check(user.userId, 'Please enter a valid email.').isEmail();
		validator.check(user.password, 'Please enter the password.').notEmpty();
		validator.check(user.displayName, 'Please enter your name.').notEmpty();
		var errors = validator.getErrors();
		if (errors.length == 0) {			
			var _this = this;
			_this.undelegateEvents();
			$('button#signupSubmit').addClass('disabled');
			$('button#signupSubmit i').attr('class', 'icon-spinner icon-spin');
			$('#error-message').empty();
			$('#error-message').hide();
			
			$.post('/createUser', {'user': user}, function(result){
				if (result === 'user_exists_error'){
					$('#error-message').append('Sorry, it looks like the email belongs to an existing account. Please use another email to sign up.');
					$('#error-message').show();
					$('button#signupSubmit').removeClass('disabled');
					$('button#signupSubmit i').removeClass('icon-spinner icon-spin');
				} else if (result === 'user_created') {
					$('#signupContent').empty();
					$('#signupContent').append('<div class="success message">Thanks for your registration. Your account has been created. Please login now on the left!</div>');
				}
				_this.delegateEvents();
			});
		}else{
			$('#error-message').empty();
			$('#error-message').append(errors.join('<br/>'));
			$('#error-message').show();
		}
		
	}
	
});	

$(document).ready(function(){
	var view = new LoginView;
});
	
})(jQuery)

