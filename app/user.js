
var Defaults = require('defaults');
var GameList = require('./gamelist');
var UserList = require('./userlist');
var Score = require('./score');

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
		gameRef: null,
		isPlaying: false,
		words: {},
		score: 0,
		name: "Guest"+Math.round( Math.random()*999999 + 100000 ),
		registered: false,
	});

	this.server = null;
	this.userlist = null;

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

		},

		/**
		 * Remove the user from any current game and send them back to the main page
		 */
		leaveGame: function() {
			var g = self.data.gameRef;
			if ( !!g )
			{
				g.removeUser( self );
			}
		},

		/**
		 * Check a word the user entered if the user is in a game
		 * If it's correct, add it to the user's words and score it
		 */
		checkWord: function( args ) {
			var g = self.data.gameRef;
			var found = false;
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
					self.scoreWord( w );
				}
			}

			// Send a message back
			self.connection.send( JSON.stringify({
				action: "onWordChecked",
				args: { found: found }
			}) );

		},

		/**
		 * Create a new game and add this user to it
		 * @return {[type]} [description]
		 */
		createGame: function( args ) {
			console.log("Creating game");
			self.actions.leaveGame();
			var g = GameList.create( args );
			g.addUser( self, true );
			// self.broadcastUpdateFull();
		},

		/**
		 * Initialize the game this user is currently joined to
		 */
		initGame: function() {
			var g = self.data.gameRef;
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
		return this.data.gameRef;
	}

	// Bind a websocket connection to this user
	this.bindConnection = function( connection ) {
		var self = this;
		connection.userRef = this;
		this.connection = connection;
		// Anonymous callback functions make sure "this" context is correct
		this.connection.on( "message", function( msg ) {
			self.handleMessage( msg );
		});
		this.connection.on( "close", function( msg ) {
			self.handleDisconnect( msg );
		});
		this.connection.on( "error", function( msg ) {
			self.handleError( msg );
		});
		// Send full user data to client
		this.broadcastUpdateFull();
	}

	// Handle websocket message
	this.handleMessage = function( msg ) {

		// this refers to the connection here, so we might want to change it
		// console.log( "Message received from player " + this.id );
		try {
			// Example data: { "action": "test", "args": "dope" }
			// If this.actions["action"] exists as a function, we call it
			var msgData = JSON.parse( msg );
			if ( !!msgData.action && typeof this.actions[ msgData.action ] == "function" )
			{
				this.actions[ msgData.action ]( msgData.args );
			}
		}
		catch ( err )
		{
			console.log( err );
		}

	}

	// Handle websocket disconnect - delete this player
	this.handleDisconnect = function() {
		console.log( "Player " + this.id + " disconnected" );
		this.server = null;
		if ( this.data.gameRef )
		{
			this.data.gameRef.removeUser( this );
		}
		if ( !!this.userlist )
		{
			this.userlist.remove( this );
		}
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



}
