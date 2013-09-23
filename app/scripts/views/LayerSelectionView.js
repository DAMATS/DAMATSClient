(function() {
	'use strict';

	var root = this;

	root.define([
		'backbone',
		'communicator',
		'underscore'
	],

	function( Backbone, Communicator, UIElementTmpl ) {

		var LayerSelectionView = Backbone.Marionette.CollectionView.extend({

			tagName: "ul",

			initialize: function(options) {
			},

			onShow: function(view){

				this.listenTo(Communicator.mediator, "productCollection:updateSort", this.updateSort);

				$( ".sortable" ).sortable({
					revert: true,

					stop: function(event, ui) {
						ui.item.trigger('drop', ui.item.index());
		        	}
			    });
			},

			updateSort: function(options) {         
		        this.collection.remove(options.model);

		        this.collection.each(function (model, index) {
		            var ordinal = index;
		            if (index >= options.position)
		                ordinal += 1;
		            model.set('ordinal', ordinal);
		        });            

		        options.model.set('ordinal', options.position);
		        this.collection.add(options.model, {at: options.position});

		        this.render();
		        
		        Communicator.mediator.trigger("productCollection:sortUpdated");
		    }
		});
		
		return {'LayerSelectionView':LayerSelectionView};
	});

}).call( this );