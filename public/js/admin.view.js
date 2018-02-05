
(function($){

var AdminView = Backbone.View.extend({
	
	el: "#container",

	details_template: null,
	shipping_template: null,
	
	initialize: function() {
		details_template = $('#details-container').html();
		shipping_template = $('#shipping-container').html();
	},
	
	events: {
		"click #add-detail-button": "addRow",
		"click .remove-detail-button": "removeRow",
		"click #add-shipping-button": "addShippingRow",
		"click .remove-shipping-button": "removeShippingRow",
		"click #add-image-button": "addImage",
		"click .remove-image-button": "removeImage"
	},
	
	addRow: function() {
        $('#details-container').append(details_template);
	},

	removeRow: function(event) {
		$(event.target).parent().remove();
	},

	addShippingRow: function() {
        $('#shipping-container').append(shipping_template);
	},

	removeShippingRow: function(event) {
		$(event.target).parent().remove();
	},

	addImage: function() {
		var image = '<div><input type="text" name="images" placeholder="remote url of image" /><i class="remove-image-button icon-remove"></i></div>';
		$(image).insertBefore('#add-image-button');
	},

	removeImage: function(event) {
		$(event.target).parent().remove();
	}
	
	
});	

$(document).ready(function(){
	var view = new AdminView;
});
	
})(jQuery)

