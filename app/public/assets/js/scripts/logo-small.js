var Vue = require("vue");
module.exports = new Vue(
{
	el: "#logo-small",
	data:
	{
		/**
		 * Changes the mainpage screen if we're on the main page. Currently unused and may be removed soon.
		 */
		changeScreen: function( s, e )
		{
			if ( window.location.toString().indexOf( "game" ) < 0 )
			{
				// We only do this if we aren't in a game
				// If we're in a game, it just takes us back to the site root
				e.preventDefault();
				Logophile.MainPage.changeScreen( s );
				return false;
			}
		}
	}
} );