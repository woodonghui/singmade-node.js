(function($){

var currentPage = 0;
var apiUri;

var ListView = Backbone.View.extend({
	
	el: $("#container"),
	
	initialize: function() {
		apiUri = '/api/pieces' + baseUri;
		this.loadData(currentPage);
	},
	
	loadData: function(page){
		$('#loader .loaderButton').hide();
		$('#loader .loaderSpinner').show();
		$.ajax({
			url: apiUri + '/' + page,
			dataType: 'json',
			success: this.onLoadData
		});		
	},
	
	onLoadData: function(data) {
	
		if(_.isEmpty(data)){
			$('#loader .loaderMore').empty();
			$('#loader .loaderMore').append('<div>No more pieces to load</div>');
			return false;
		}
	
		var template = "<% _.each(items, function(item) " + 
						"{ %>" +
							"<li>"  + 
							"<a href='/piece/<%= item.slug_id %>'><img src='<%= item.waterfall_image.url %>' width='180' height='<% print(Math.round(item.waterfall_image.height/item.waterfall_image.width*180)) %>'></a>" +
							"<p><span class='title'><%= item.title %> by <a href='/designer/<%= item.designer %>'><%= item.designer %></a></span><span class='price'>S$ <%= item.price %></span></p>" + 
							"</li>" +
						"<% });"+
					" %>";

		var html = _.template(template, {items:data});
		$('#tiles').append(html);
		
		var handler = $('#tiles li');
		//if(handler) handler.wookmarkClear();
	
		handler.wookmark({
			autoResize: true, // This will auto-update the layout when the browser window is resized.
			container: $('#tiles-container'), 
			offset: 5, // Optional, the distance between grid items
			itemWidth: 180 // Optional, the width of a grid item
		});
				
		$('#loader .loaderSpinner').hide();
		$('#loader .loaderButton').show();
		
		currentPage++;
	},
	
	events: {
		"click #loader .loaderButton": "loadMore"
	},
	
	loadMore: function(){
		this.loadData(currentPage);
		return false;
	},
	
	view: function(event){
		
		var item = event.currentTarget;		
		var slug_id = $(item).attr('id');

		window.location.href = "/piece/" + slug_id;		
	}

});	

$(document).ready(function(){
	var App = new ListView;
});
	
})(jQuery)

