
var Game = require("./game.js");
var User = require("./user.js");

module.exports = new function() {

	var self = this;

	// Connect automatically when the module loads
	var splitUrl = window.location.toString().split("/");
	this.connection = new WebSocket( "ws://" + splitUrl[2].split(":")[0] + ":8080" );

	this.connection.onopen = function() {
		console.log("Websocket connection opened.");
	}

	this.connection.onclose = function() {
		console.log("Websocket connection closed.");
	}

	this.connection.onmessage = function( msg ) {
		// console.log( msg );
		var data = JSON.parse( msg.data );
		if ( !!self.callbacks[ data.action ] )
		{
			self.callbacks[ data.action ]( data.args );
		}
	}

	// Wrapper for sending "action" messages to the server
	this.action = function( name, args ) {
		var msg = { action: name, args: args };
		this.connection.send( JSON.stringify( msg ) );
	}

	// Actions the server can request the client to make upon receiving a message
	this.callbacks = {
		onGameUpdate: function( args ) {
			// console.log("Receiving game update");
			// Receiving data about the game state
			// We don't always receive the full game state, because it would be a waste of resources to constantly transfer that data
			// So we only replace things if they don't exist yet
			for ( k in args )
			{
				if ( !Game[k] )
				{
					Game[k] = args[k];
				}
				else
				{	
					for ( each in args[k] )
					{
						Game[k][each] = args[k][each];
					}
				}
			}
		},
		onUserUpdate: function( args ) {
			// Replace local user data with remote user data
			for ( k in args )
			{
				User[k] = args[k];
			}
			console.log( User );
		}
	}

}
