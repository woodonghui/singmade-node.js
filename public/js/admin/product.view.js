(function($){

var ProductView = Backbone.View.extend({
	
	el: "#main",

	details_template: '<div class="input-group" style="margin-bottom: 10px;">' + 
    '<span class="input-group-addon">' + 
    '<select class="form-control" style="width: 200px;" name="details[key]">' + 
        '<option value="manufacture">Manufacture</option>' + 
        '<option value="composition">Composition</option>' +
        '<option value="size">Size</option>' +
        '<option value="care">Care</option>' +
        '<option value="note">Note</option>' + 
        '<option value="model\'s body measurements">Model\'s body measurements</option>' + 
    '</select>' + 
    '</span>' + 
    '<textarea class="form-control" name="details[value]" rows="3"></textarea>' + 
    '<span class="input-group-addon"><i class="fa fa-times remove-button"></i></span>' + 
    '</div>',

	shipping_template: '<div class="input-group" style="margin-bottom: 10px;">' + 
	  '<span class="input-group-addon">' + 
	    '<select class="form-control" style="width: 200px;" name="shipping[key]">' + 
	        '<option value="shipping from">Shipping From</option>' + 
	        '<option value="estimated time">Estimated Time</option>' + 
	    '</select>' + 
	    '</span>' + 
	    '<textarea class="form-control" name="shipping[value]" rows="2"></textarea>' + 
	    '<span class="input-group-addon"><i class="fa fa-times remove-button"></i></span>' + 
	'</div>',

	availableTags: ['jewelry', 'wallet', 'ring'],
	
	initialize: function() {
		$('#tags').tagit({ availableTags: this.availableTags });
	},
	
	events: {
		"click #add-detail-button": "addRow",
		"click .remove-button": "removeRow",
		"click #add-shipping-button": "addShippingRow"
		// "click #add-image-button": "addImage",
		// "click .remove-image-button": "removeImage"
	},
	

	addRow: function() {
        $(this.details_template).insertBefore('#add-detail-button');
	},

	removeRow: function(event) {
		$(event.target).parent().parent().remove();
	},

	addShippingRow: function() {
        $(this.shipping_template).insertBefore('#add-shipping-button');
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
	var view = new ProductView;
});
	
})(jQuery)

