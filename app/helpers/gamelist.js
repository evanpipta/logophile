var Game = require( "./game" );

/**
 * GameList object
 */
module.exports = new function() {

	this.games = {};

	// Timeout for auto-destroying games if nobody is in them
	this.killTime = 10;

	/**
	 * Create a new game and add it to the list of games
	 * @param  {object} options - (optional) Options to pass to the new game constructor
	 * @return {object}        The newly created game instance
	 */
	this.create = function( options ) {

		var g = new Game( options );

		// Generate a new game id until it's unique
		// For now this should work fine, if the app becomes mega popular we might have to find a new way to do this
		while ( !!this.games[ g.id ] ) {
			g.id = Math.round( Math.random() * 999999 + 100000 );
		}

		// Append game to games list
		this.games[ g.id ] = g;

		return g;

	}

	/**
	 * Remove a game by id
	 */
	this.removeById = function( id ) {
		if ( !!this.games[ id ] ) {
			this.games[ id ] = null;
			delete this.games[ id ];
		}
	}

	/**
	 * Remove a game by reference
	 */
	this.remove = function( game ) {
		console.log( "Removing game " + game.data.id );
		if ( !!this.games[ game.id ] ) {
			delete this.games[ game.id ];
			game = null;
		}
	}

	/**
	 * Returns a game by id, if such a game exists
	 * @param  {Number} id - The id of the game to find
	 * @return {Object}    The game instance
	 */
	this.getById = function( id ) {
		return ( !!this.games[ id ] ) ? this.games[ id ] : false;
	}

	/**
	 * Gets games by index in the games list
	 * @return {Object} The game instance
	 */
	this.getByIndex = function( index ) {
		var i = 0;
		for ( var k in this.games ) {
			if ( i == index ) {
				return this.games[ k ];
			}
			i++;
		}
		return false;
	}

	/**
	 * Returns an array of games that have the specified name (Not implemented)
	 * @param  {String} n - The name of the games to find
	 * @return {Object}   The game instance
	 */
	this.getByName = function( n ) {
		// Not implremented, do we really need this for anything?
	}

	/**
	 * Returns a list of short data for each active public game - used for stuff like the list of active games in the lobby
	 * @return {Array} Array of short data from active games
	 */
	this.getAllShort = function() {
		var list = [];
		for ( var k in this.games ) {
			if ( !this.games[ k ].data.private ) {
				list.push( this.games[ k ].getPublicGameDataShort() );
			}
		}
		return list;
	}


	/**
	 * Checks all games in the list to see if they're empty and whether or not they need to be deleted
	 */
	this.killTimer = function() {
		for ( var key in this.games ) {
			var game = this.games[ key ];
			if ( game.users.playing.length == 0 ) {
				// Nobody is in the game, start the kill timer if it isn't started
				if ( !game.killTimeStart ) {
					game.killTimeStart = ( new Date() ).getTime() / 1000;
				}
				else if ( ( ( new Date() ).getTime() / 1000 ) - game.killTimeStart >= this.killTime ) {
					// Check if kill time has passed, and if so destroy the game and clear any updates it has running
					console.log( "Destroying game " + game.id );
					clearInterval( game.data.timerId );
					clearInterval( game.updateTimerId );
					clearInterval( game.data.pauseTimerId );
					game.data.board = null;
					game = null;
					delete this.games[ key ];
				}
			}
			else {
				// Players are in the game
				game.killTimeStart = null;
			}
		}
	}

	// Start kill timer automatically
	var gList = this;
	setInterval( function() {
		gList.killTimer();
	}, 1000 );

}