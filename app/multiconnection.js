
// Handles sending messages to multiple websocket connections at once
module.exports = function() {

	// The array of connections
	this.list = [];

	/**
	 * Easier getter for this.list.length
	 */
	this.count = function() {
		return this.list.length;
	}

	/**
	 * Adds a connection
	 * @param {Object} conn - the websocket connection object
	 */
	this.add = function( conn ) {
		var mc = this;
		this.list.push( conn );
		// Remove the connection when it's closed
		conn.on( "close", function( msg ) {
			mc.remove( conn );
			conn = null;
		});
		// Or when it errors
		conn.on( "error", function( msg ) {
			mc.remove( conn );
			conn = null;
		});
	}

	/**
	 * Removes a connection
	 * @param  {Object} conn - the connection instance to remove
	 * @return {Boolean}      returns true if the connection was removed, false if it wasn't there to begin with
	 */
	this.remove = function( conn ) {
		for ( var i = 0; i < this.list.length; i++ )
		{
			if ( this.list[i] === conn )
			{
				this.list.splice( i, 1 );
				return true;
			}
		}
		return false;
	}

	/**
	 * Sends a message to all connections
	 * @param  {Object} msg - message to send
	 */
	this.send = function( msg ) {
		for ( var i = 0; i < this.list.length; i++ )
		{
			if ( this.list[i].readyState == 1 )
			{
				this.list[i].send( msg );
			}
		}
	}

	/**
	 * Removes the game id from all active connections
	 */
	this.removeGameId = function() {
		for ( var i = 0; i < this.list.length; i++ )
		{
			if ( !!this.list[i].gameId )
			{
				this.list[i].gameId = null;
			}
		}
	}

}