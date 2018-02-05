
(function($){

var CheckoutView = Backbone.View.extend({
	
	el: "#container",
	
	initialize: function() {
	},
	
	events: {
		"click button#placeOrder": "placeOrder"
	},
	
	placeOrder: function(){		
		var order = {
			name: {
				title: $("select#title").val().trim(),
				firstname: $("input#firstname").val().trim(),
				surname: $("input#surname").val().trim()
			},
			address: {
				street: $("input#street").val().trim(),
				unitnumber: $("input#unitnumber").val().trim(),
				city: $("input#city").val().trim(),
				postcode: $("input#postcode").val().trim()
			},
			contact: {
				phone: $("input#phone").val().trim(),
				email: $("input#email").val().trim()
			}			
		};
	
		Validator.prototype.error = function (msg) {
			this._errors.push(msg);
			return this;
		}

		Validator.prototype.getErrors = function () {
			return this._errors;
		}

		var validator = new Validator();

		validator.check(order.name.firstname, '[firstname]Please enter your First Name.').notEmpty();
		validator.check(order.name.surname, 'Please enter your Surname.').notEmpty();
		validator.check(order.address.street, 'Please enter your Street Name.').notEmpty();
		validator.check(order.address.unitnumber, 'Please enter your BLK / Unit No.').notEmpty();
		validator.check(order.address.city, 'Please enter your City.').notEmpty();
		validator.check(order.address.postcode, 'Please enter your valid Postal Code.').isInt();
		validator.check(order.contact.email, 'Please enter your valid Email.').isEmail();
		validator.check(order.contact.phone, 'Please enter your Phone.').notEmpty();

		var errors = validator.getErrors();
		if (errors.length == 0) {
			
			var _this = this;
			_this.undelegateEvents();
			$('#placeOrder').addClass('disabled');
			$('#placeOrder i').attr('class', 'icon-spinner icon-spin');
			
			$.post('/api/order', {'order': order}, function(data){
				if (data == 'ok'){
					window.location.href = '/checkout/payment';
				} else {
					$('#placeOrder').removeClass('disabled');
					$('#placeOrder i').attr('class', 'icon-file-alt');
					_this.delegateEvents();					
				}
			});
		}
		
	}
	
});	

$(document).ready(function(){
	var view = new CheckoutView;
});
	
})(jQuery)

