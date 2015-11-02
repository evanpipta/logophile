
require("./vuesync.js");
var GameData = require("./gamedata.js");
var User = require("./userdata.js");

module.exports = new function() {

	var self = this;

	// Connect automatically when the module loads
	var splitUrl = window.location.toString().split("/");
	this.connection = new WebSocket( "ws://" + splitUrl[2].split(":")[0] + ":8080" );

	this.connection.onopen = function() {

		console.log("Websocket connection opened.");

		// If this page is a game, try to join it automatically
		if ( window.location.toString().indexOf("/game/") > -1 )
		{
			// For now, there will always be a single url parameter contaning the game id as its key, and no value
			var gameId = window.location.toString("").split("?")[1];
			if ( gameId )
			{
				gameId = gameId.split("#")[0];
				self.action( "joinGame", { id: gameId, playing: true } );
				console.log("Joining game " + gameId );
			}
		}

	}

	this.connection.onclose = function() {
		setTimeout( function() {
			alert("Websocket connection closed.");
		}, 200 );
	}

	this.connection.onmessage = function( msg ) {
		// Handle messages from the server 
		var data = JSON.parse( msg.data );
		if ( !!self.events[ data.action ] )
		{
			self.events[ data.action ]( data.args );
		}
	}

	/**
	 * Wrapper for sending "action" messages sent to the server, simplifies the code needed in the main app script
	 * @param  {String} name - Name of the backend user action to call. See actions object in /app/user.js for all possible actions
	 * @param  {Object]} args - Arguments for the action
	 */
	this.action = function( name, args ) {
		var msg = { action: name, args: args };
		this.connection.send( JSON.stringify( msg ) );
	}

	// Actions the server can request the client to make upon receiving a message
	this.events = {

		/**
		 * Syncrhonizes the GameData model with what was sent in the message
		 * See vuesync.js for more details
		 * @param {Object} args - Should have an identical structure to the GameData model object
		 */
		onGameUpdate: function( args ) {
			// Sync GameData.game and GameData.users separately
			Object.$sync( GameData.game, args.game, function() {
				// console.log( "sync result: " + JSON.stringify( GameData ) );
			} );
			Object.$sync( GameData.users, args.users, function() {
				// console.log( "sync result: " + JSON.stringify( GameData ) );
			} );
		},

		/**
		 * Synchronizes the User model with what was sent in the message
		 * See vuesync.js for more details
		 * @param {Object} args - Should have identical structure to the User model object
		 */
		onUserUpdate: function( args ) {

			Object.$sync( User, args );
		},


		/**
		 * Reset the user's guessed words, and anything else we need to do at round start
		 * @param {Object} args - Currently not used
		 */
		onRoundStart: function( args ) {
			User.words = {};
		},

		/**
		 * Redirect the user to the newly created game url, and anything else we need to do upon game creation
		 * @param {Object} args - Should contain an "id" property specifying the game id
		 */
		onGameCreated: function( args ) {
			window.location.href = "/game/?" + args.id;
		},


		/**
		 * Redirect to an empty game page
		 * This should never happen because games shouldn't get destroyed while someone is connected to them, but whatever
		 */
		onGameDestroyed: function() {
			window.location.href = "/game/";
		},

		/**
		 * Event that happens after the user checks a word. This currently isn't used for anything.
		 */
		onWordChecked: function( args ) {
			console.log( args );
		}

	}

}
