
var Defaults = require("defaults");
var GameList = require("./gamelist");
var UserList = require("./userlist");
var Score = require("./score");
var MultiConnection = require("./multiconnection");

/**
 * User class
 * @param  {object} options 
 */
module.exports = function( options ) {

	var self = this;

	// This should be unique and passed in on user instantiation
	// NEVER send this out as public data to users, because it would allow users to authenticate as someone else
	// We use the user id as a cookie for authentication, which should be fine since our game doesn't contain any sensitive data
	this.id = ( !!options.id ) ? options.id : 0;

	this.data = Defaults( options, {
		logged: false,
		joinedId: 0,
		isPlaying: false,
		words: {},
		score: 0,
		name: "Guest"+Math.round( Math.random()*999999 + 100000 ),
		registered: false,
	});

	// Time in seconds to remove user from a game if all connections to that game are closed
	this.autoLeaveTime = 5;
	this.autoLeaveTimerId = null;
	this.autoLeaveStart = null;

	this.gameRef = null;
	this.server = null;
	this.userlist = null;

	this.connection = new MultiConnection();

	/**
	 * Actions that can be called by the client sending a message
	 */
	this.actions = {

		/**
		 * Change the user's name and strip input of non-alphanumeric chars
		 * @param {Object} args - args.name should be the new name
		 */
		setName: function( args ) {
			if ( typeof args.name == "string" )
			{
				// Eventually we may make names unique, and duplicate names will get a random string of numbers after them
				self.data.name = args.name.replace( /[^a-zA-Z0-9\s]/g, "" );
				console.log( "User " + self.id + " changed their name to " + self.data.name );
			}
			self.broadcast({ name: self.data.name });
		},

		/**
		 * Remove the user from any current game they're in and join them to the game id specified in args
		 * When it's done. we want to make sure the new game data gets sent back
		 * @return {[type]} [description]
		 */
		joinGame: function( args ) {
			var newGame = GameList.getById( args.id );
			if ( newGame )
			{
				console.log( "Moving user " + self.id + " to game " + args.id );
				if ( self.gameRef && self.gameRef !== newGame )
				{
					self.actions.leaveGame();
				}
				newGame.addUser( self, !!args.playing ? args.playing : false );

				// Attach the connection to this gameid
				args.connection.gameId = args.id;

			}
		},

		/**
		 * Remove the user from their current game, if they're in one
		 * Also removes the game id from all of their active connections
		 */
		leaveGame: function() {
			var g = self.gameRef;
			if ( !!g )
			{
				console.log( "Removing user " + self.id + " from game " + g.id );
				g.removeUser( self );
				self.connection.removeGameId();
			}
		},

		/**
		 * Check a word the user entered if the user is in a game
		 * If it's correct, add it to the user's words and score it
		 */
		checkWord: function( args ) {
			var g = self.gameRef;
			var found = false;
			var alreadyFound = false;
			if ( typeof args.word == "string" && !!g )
			{
				// console.log("Checking word " + args.word );
				if ( !g.data.round.started )
				{
					console.log("Round not started, can't check words");
					return false;
				}
				var w = args.word.replace( /[^a-zA-Z]/g, "" ).toUpperCase();
				found = g.check( w );
				if ( found )
				{
					if ( !!self.data.words[ w ] )
					{
						alreadyFound = true;
					}
					else
					{
						self.scoreWord( w );
					}
				}
			}

			// Send a message back
			self.connection.send( JSON.stringify({
				action: "onWordChecked",
				args: { found: found, alreadyFound: alreadyFound }
			}) );

		},

		/**
		 * Create a new game and add this user to it
		 * @return {[type]} [description]
		 */
		createGame: function( args ) {
			// Temporarily deleting args name for fun
			// delete args.name;
			console.log("Creating game");
			self.actions.leaveGame();
			var g = GameList.create( args );
			g.addUser( self, true );
			// self.broadcastUpdateFull();
			self.connection.send( JSON.stringify({
				action: "onGameCreated",
				args: { id: g.id }
			}));
		},

		/**
		 * Initialize the game this user is currently joined to
		 */
		initGame: function() {
			var g = self.gameRef;
			if ( !!g )
			{
				g.init();
			}
		},

		/**
		 * Log this user in with given credentials
		 */
		login: function() {},

		/**
		 * Log this user out if they're currently logged in
		 */
		logout: function() {}

	}

	/**
	 * Adds a word to the player's found words and scores it
	 */
	this.scoreWord = function( w ) {
		this.data.words[ w ] = Score( w );
		this.data.score += this.data.words[ w ];
		console.log( "Player " + this.id + " found word " + w + " for " + this.data.words[ w ] + " points. Total: " + this.data.score );
		// Broadcast an update for words and score
		self.broadcast({ words: self.data.words, score: self.data.score });
	}

	/**
	 * Return the game this user is joined to
	 * @return {Object} - The game instance the user is joined to, or false if the user isn't in any game
	 */
	this.getGame = function() {
		return this.gameRef;
	}

	// Bind a websocket connection to this user
	this.bindConnection = function( conn ) {
		var self = this;
		// conn.userRef = this;
		this.connection.add( conn );
		// Anonymous callback functions make sure "this" context is correct
		conn.on( "message", function( msg ) {
			self.handleMessage( msg, conn );
		});
		conn.on( "close", function( msg ) {
			self.handleDisconnect( msg );
		});
		conn.on( "error", function( msg ) {
			self.handleError( msg );
		});
		// Send full user data to client
		this.broadcastUpdateFull();
	}

	// Handle websocket message
	this.handleMessage = function( msg, conn ) {
		// Example data: { "action": "test", "args": {"dope": "af"} }
		// If this.actions[data.action] exists as a function, we call it
		var msgData = JSON.parse( msg );
		if ( !!msgData.action && typeof this.actions[ msgData.action ] == "function" )
		{
			// Make sure msgData.args is an object
			msgData.args = ( !!msgData.args ) ? msgData.args : {};
			// We also pass the connection object as an argument to the action
			msgData.args.connection = conn;
			// Then we can call the action
			this.actions[ msgData.action ]( msgData.args );
		}

	}

	// Handle websocket disconnect
	this.handleDisconnect = function() {
		console.log( "Player " + this.id + " lost a connection." );
	}

	// Handle websocket error
	this.handleError = function() {
		console.log( "Error with connection from player " + this.id );
	}

	// Reset this player's score and words list - should be called by the game before a round starts
	this.resetScore = function() {
		this.data.words = {};
		this.data.score = 0;
	}

	// Broadcast full user data to the connected client
	this.broadcastUpdateFull = function() {
		var data = this.data;
		this.broadcast( data );
	}

	this.broadcast = function( args ) {
		this.connection.send( JSON.stringify({
			action: "onUserUpdate",
			args: args
		}));
	}

	/**
	 * Remove the user from any joined games if they've been disconnected for a few seconds, OR if none of their connections have a game id assigned 
	 */
	this.autoLeaveGame = function() 
	{
		// Check if any of the open connections are in a game
		var inGame = false;
		for ( var i = 0; i < this.connection.count(); i++ )
		{
			// console.log("user " + this.id + ",  connection " + i +" - state: " + this.connection.list[i].readyState + ", "+" gameId: " + this.connection.list[i].gameId );
			if ( this.connection.list[i].readyState == 1 && !!this.connection.list[i].gameId )
			{
				inGame = true;
			}
		}
		if ( !inGame && this.gameRef )
		{
			// This user is not active in a game, start the auto leave timer
			if ( !this.autoLeaveStart )
			{
				this.autoLeaveStart = (new Date()).getTime() / 1000;
			}
			else if ( ((new Date()).getTime() / 1000 ) - this.autoLeaveStart >= this.autoLeaveTime )
			{
				// Leave any connected game
				this.actions.leaveGame();
			}
		}
		else
		{
			// This user is active in a game
			this.autoLeaveStart = null;
		}
	}

	// Start auto leave timer automatically
	var u = this;
	this.autoLeaveTimerId = setInterval( function() {
		u.autoLeaveGame();
	}, 1000 );

}
