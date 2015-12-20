var Vue = require("vue");
module.exports = new Vue(
{
	el: "#popup-background",
	data:
	{
		title: "",
		showCancel: true,
		showPopup: false,
		buttons: []
	},
	methods:
	{
		/**
		 * Hides the popup
		 */
		hide: function()
		{
			this.showPopup = false;
		},

		/**
		 * Shows the popup
		 */
		show: function()
		{
			this.showPopup = true;
		},

		/**
		 * Hides only if the click came from the target element
		 */
		hideFromTarget: function( e )
		{
			if ( e.target.id == this.$el.id )
			{
				this.hide();
			}
		},

		/**
		 * Mounts an instance of a Vue component (i.e. made with Vue.extend) in the popup content area
		 * The instance should have a template
		 */
		setContent: function( instance )
		{
			instance.$mount( "#popup-content" );
		},

		/**
		 * Wraps all functionality of the popup, allowing creation and display of a new popup
		 */
		create: function( options ) {
			for ( each in options )
			{
				if ( !!this[ each ] )
				{
					this[ each ] = options[ each ];
				}
			}
			// console.log("HELLO MOTHERFUCKER?");
			this.title = options.title;
			this.setContent( options.content );
			this.show();
		}
	}

} );
