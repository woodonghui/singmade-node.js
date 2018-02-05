
(function($){

var PaymentView = Backbone.View.extend({
	
	el: "#container",
	
	initialize: function() {
	},
	
	events: {
		"click button#editOrder": "editOrder"
	},
	
	editOrder: function(){
		window.location.href = '/checkout';
	}
	
});	

$(document).ready(function(){
	var view = new PaymentView;
});
	
})(jQuery)

