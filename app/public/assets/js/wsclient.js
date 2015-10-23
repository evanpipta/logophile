
var GameData = require("./gamedata.js");
var User = require("./userdata.js");

module.exports = new function() {

	var self = this;

	// Connect automatically when the module loads
	var splitUrl = window.location.toString().split("/");
	this.connection = new WebSocket( "ws://" + splitUrl[2].split(":")[0] + ":8080" );

	this.connection.onopen = function() {
		console.log("Websocket connection opened.");
		// If this page is a game, join the game
		if ( window.location.toString().indexOf("/game/") > -1 )
		{
			var gameId = window.location.toString("").split("?")[1];
			self.action( "joinGame", { id: gameId, playing: true } );
			console.log("Joining game " + gameId );
		}
	}

	this.connection.onclose = function() {
		// console.log("Websocket connection closed.");
		setTimeout( function() {
			alert("Websocket connection closed.");
		}, 200 );
		// if ( window.location.href.indexOf("/game/") > 0 )
		// {
		// 	// Redirect if ws disconnected while in a game screen
		// 	window.location.href = "/no-ws/";
		// }
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
			for ( k in args )
			{
				if ( !GameData[k] )
				{
					GameData.$add( k, args[k] );
				}
				else
				{	
					for ( each in args[k] )
					{
						// use $set method to ensure vue updates the displayed data
						GameData[k].$set( each, args[k][each] );
					}
				}
			}
		},
		onUserUpdate: function( args ) {
			// Replace local user data with remote user data
			for ( k in args )
			{
				// use $set method to ensure vue updates the displayed data
				User.$set( k, args[k] );
			}
			console.log( User );
		},
		onGameCreated: function( args ) {
			// Redirect the user to the newly created game
			window.location.href = "/game/?" + args.id;
		},
		onGameDestroyed: function() {
			// This should never happen because games shouldn't get destroyed while someone is connected, but whatever.
			window.location.href = "/game/?";
		}
	}

}
