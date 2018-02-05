// piece.view.js
(function($){
var PieceView = Backbone.View.extend({
	
	el: "#container",
	
	initialize: function() {
		$("#slider1").responsiveSlides({
			auto: false,
			manualControls: '#slider1-pager'
		});
		//apply zoom
		_.each($('#slider1 li'), function(e){ $(e).zoom(
			{
				target: '#description-container',
				onZoomOut: function(){ $(this).css('z-index', -999); },
				onZoomIn: function(){ $(this).css('z-index', 99); }
			})
		});


		$('#selections li').click(function(e){
			$('#selections li').removeClass('selected');
			$(this).addClass('selected');
		});

		
		//last and next product
		$.get('/api/prenexpiece', {_id: piece_id}, function(data){
			if(data) {
				if(data.pre) { $('.nav-arrow.left i').wrap('<a href="/piece/'+ data.pre +'"></a>'); $('.nav-arrow.left').show(); }
				if(data.nex) { $('.nav-arrow.right i').wrap('<a href="/piece/'+ data.nex +'"></a>'); $('.nav-arrow.right').show(); }
			}
		});

		$.ajax({
			url: '/api/pieces/more/' + designer_id,
			data: {currentId: piece_id},
			statusCode: {
				200: function(data){
					$('.fa-spinner').remove();
					if(!data) {
						$('#more-designs').append('There are no more designs.');
						return false;
					}
					var template = "<ul class='grid'><% _.each(items, function(item) { %>" +  
							   "<li>"  + 
							   "<a href='/piece/<%= item.slug_id %>'><img src='<%= item.table_image.url %>' /></a>" +
							   "</li>" +
							   "<% }) %>" +
							   "</ul>";
					var html = _.template(template, {items:data});
					$('#more-designs').append(html);
				}
			}
		});

	},
	
	events: {
		"click #piece-container .buy": "AddToCart"
	},
	
	AddToCart: function(){
		var _this = this;
		_this.undelegateEvents();

		$('.buy').attr('disabled', true);
		$('.buy').append('<i class="fa fa-spinner fa-spin"></i>');
		
		var selection = $('#selections li.selected').text();

		var url = "/cart/add/" + slug_id;
		if(!_.isEmpty(selection)){
			url += "?selection=" + selection;
		}

		$.ajax({
			url: url,
			statusCode: {
				200: function(response){
					$('.message').remove();
					if(response.error){
						$('.buy').before('<div class="message error">' + response.message + '</div>');
					} else {
						$('.buy').before('<div class="message success"><a href="/cart">The item is added to your shopping cart.<br><i class="fa fa-shopping-cart"></i> Checkout Now</a></div>');
					}
					$('.message').delay(5000).fadeOut();
					$('.buy i.fa-spinner').remove();
					$('.buy').attr('disabled', false);
					_this.delegateEvents();
				},
				404: function(){
					$('.buy').before('<div class="message error">Sorry, our server has encountered a problem when processing your request. Please try it again later.</div>');
					$('.message').delay(5000).fadeOut();
					$('.buy i.fa-spinner').remove();
					$('.buy').attr('disabled', false);
					_this.delegateEvents();
				}
			}
		});

	}
	
});	

$(document).ready(function(){
	var view = new PieceView;	
});
	
})(jQuery)

