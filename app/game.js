
var Defaults = require( "defaults" );
var Frequencies = require( "./frequencies" );
var Board = require( "./board" );
var Dictionary = require( "./dictionary" );
var User = require( "./user" );

/**
 * Game class
 * @param  {object} options [description]
 */
module.exports = function( options ) {
	
	this.id = Math.round( Math.random()*999999 + 100000 );

	this.data = Defaults( options, {
		boardSize: 5,
		frequences: "Uniques",
		name: Dictionary.getRandom( Math.round( ( Math.random() ) * 12 ) + 3 ) +" "+ Dictionary.getRandom( Math.round( ( Math.random() ) * 12 ) + 3 ),
		timeLimit: 30,
		pauseTime: 10,
		private: false,
		ranked: false,
		allowGuests: true,
		scoreStyle: "Normal", 			// "normal" or "prolific"
		initd: false,
		rounds: 0,						// rounds played so far
		minLettersToScore: 4,	
		boardHighFrequency: true,
		boardMinWords: 280,			// Only applies if high frequency is false
		boardRequireLength: 9		// Only applies if high frequency is false
	});

	this.initTime = this.data.pauseTime;

	// Never allow guests is the game is ranked - for later
	if ( this.data.ranked == true )
	{
		this.data.allowGusts = false;
	}

	// Timer for rounds
	this.data.timerId = null;
	this.data.round = {
		started: false,
		startTime: null,
		elapsed: 0,
		lastSolution: {},
		lastBoardArray: []
	};

	// Timer and data for pause betwen rounds
	this.data.pauseTimerId = null;
	this.data.isPaused = true;
	this.data.pauseElapsed = 0;
	this.data.pauseRemaining = this.data.pauseTime;
	this.data.pauseStartTime = 0;

	// Current board
	this.data.board = new Board( this.data.boardSize );

	// Timer for broadcasting game updates to connected users
	this.updateTimerId = null;

	this.users = {
		joined: [],		// Joined as spectators
		playing: [],		// Joined as players
		queued: []		// Waiting until round is over to join as players
	}

	/**
	 * Initialize the game when the host is done setting it up. This only happens once per instance of the game.
	 */
	this.init = function() {
		console.log("Initializing game");
		if ( !this.data.initd )
		{
			this.data.initd = true;

			this.data.board.minLettersToScore = this.data.minLettersToScore;
			this.data.board.minWords = this.data.boardMinWords;
			this.data.board.wordLengthRequirement = this.data.boardRequireLength;
			this.data.board.minLettersToScore = this.data.minLettersToScore;

			this.startPauseTimer( this.initTime );

			// Send full game state to clients
			this.broadcastGameStateFull();

			// Send initial message to all users
			this.broadcast( JSON.stringify({
				action: "onGameStart"
			}));

			// Start an interval for broadcasting the short game data to users
			var self = this;
			setInterval( function() {
				self.broadcastGameStateShort();
			}, 100 );
		}
	}

	/**
	 * Start the pause timer. A new round will be started when the pause time is up.
	 * @param {Number} time - (Optional) - if specified, the passed time will be used instead of the one in this.data
	 */
	this.startPauseTimer = function( time ) {

		// Star generating the next board
		this.data.board.boardSize = this.data.boardSize;
		this.data.board.letters = Frequencies[this.data.frequencies];
		this.data.board.gameRef = this;
		if ( this.data.boardHighFrequency )
		{
			// If we're doing high frequency, start high-frequency randomization
			this.data.board.startHighFrequencyRandomize( this.data.boardSize, this.data.pauseTime - 1 );
		}
		else 
		{
			// Otherwise just randomize once
			this.data.board.randomize();
		}

		var game = this;
		var pauseTime = typeof time == "number" ? time : game.data.pauseTime;
		game.data.isPaused = true;
		game.data.pauseElapsed = 0;
		game.data.pauseStartTime = Date.now() / 1000;
		game.data.pauseTimerId = setInterval( function() {
			if ( game.data.isPaused )
			{
				game.data.pauseElapsed = Date.now() / 1000 - game.data.pauseStartTime;
				game.data.pauseRemaining = game.data.pauseStartTime - game.data.pauseElapsed;
				if ( game.data.pauseElapsed >= pauseTime )
				{
					// Pause time is up, start a new round
					game.go();
				}
			}
		}, 500 );
	}

	/**
	 * Sends a message to all connected users
	 * @param  {String} msg - The message to send. convert to string before calling.
	 */
	this.broadcast = function( msg ) {
		for ( k in this.users )
		{
			for ( var i = 0; i <this.users[k].length; i++ )
			{
				// console.log("Sending message to user " + this.users[k][i].id );
				this.users[k][i].connection.send( msg );
			}
		}
	}

	/**
	 * Broadcast the game's full public data to all users
	 * We only need to do this upon certain events (i.e. new board), or when someone first joins the game
	 */
	this.broadcastGameStateFull = function() {
		console.log("Broadcasting game data to clients");
		this.broadcast( JSON.stringify({
			action: "onGameUpdate",
			args: {
				game: this.getPublicGameData(),
				users: this.getPublicUserData()
			}
		}));
	}

	/**
	 * Broadcast only the game's public data that needs to constantly be updated
	 * This pretty much just includes the list of users, their scores, and the time remaiining
	 */
	this.broadcastGameStateShort = function() {
		this.broadcast( JSON.stringify({
			action: "onGameUpdate",
			args: {
				game: {
					roundTime: this.data.round.elapsed,
					pauseTime: this.data.pauseElapsed
				},
				users: this.getPublicUserData()
			}
		}));
	}

	/**
	 * Starts a round
	 */
	this.startRound = function ( game ) {	

		console.log("Starting round.");

		clearInterval( game.data.pauseTimerId );
		game.data.isPaused = false;
		game.data.rounds++;

		game.data.round.wordsFound = {};
		game.data.round.started = true;
		game.data.round.startTime = Date.now() / 1000;
		game.data.timerId = setInterval( function() {
			game.data.round.elapsed = Date.now() / 1000 - game.data.round.startTime;
			game.data.round.remaining = game.data.timeLimit - game.data.round.elapsed;
			if ( game.data.round.elapsed >= game.data.timeLimit )
			{
				// Time is up, stop the round
				game.stop();
			}
		}, 100 );

		// Send full game state to clients
		game.broadcastGameStateFull();

		// Send round start message to clients
		game.broadcast( JSON.stringify({
			action: "onRoundStart"
		}));
	}

	/**
	 * Ends the round
	 */
	this.endRound = function() {
		console.log("Ending round.");
		clearInterval( this.data.timerId );
		this.data.round.started = false;
		this.data.round.startTime = null;
		this.data.round.lastSolution = this.data.board.solution;
		this.data.round.lastSolutionCounts = this.data.board.solutionCounts;
		this.data.round.lastBoardArray = this.data.board.boardArray;
		// Put users who were queued to join into the active players list
		for ( k in this.users.queued )
		{
			this.addUser( this.users.queued[k], true );
		}

		// Send the full game state to clients
		this.broadcastGameStateFull();

		// Send round end message to clients
		this.broadcast( JSON.stringify({
			action: "onRoundEnd"
		}));

		// Restart the pause timer
		this.startPauseTimer();
	}

	/**
	 * Alias for endRound
	 */
	this.stop = function() {
		this.endRound();
	}

	/**
	 * Gets the round time as a string
	 */
	this.getTime = function() {
		var m = Math.floor( Math.round(this.data.round.elapsed) / 60 ).toString();
		var s = (Math.round(this.data.round.elapsed) % 60).toString();
		return m + ":" + ( (s < 10) ? "0"+s : s );
	}

	/**
	 * Gets the round time remaining as a string
	 */
	this.getTimeRemaining = function() {
		var m = Math.floor( Math.round(this.data.round.remaining) / 60 ).toString();
		var s = (Math.round(this.data.round.remaining) % 60).toString();
		return m + ":" + ( (s < 10) ? "0"+s : s );
	}

	/**
	 * Checks a word in the current board
	 * @param {String} word - the word to check
	 * @return {Boolean|String} true if the word exists, false if it doesn't
	 */
	this.check = function( word ) {
		var found = ( this.data.round.started && word.length >= this.data.minLettersToScore ) ? this.data.board.check( word ) : false;
		return found;
	}

	/**
	 * Resets the timer, randomizes the board, and starts a new round
	 */
	this.prepareRound = function() {

		// We reset all the users' words and scores here
		for ( p in this.users.playing )
		{
			var player = this.users.playing[p];
			player.resetScore();
		}

		// Then reset timer
		this.timer = this.timeLimit;

		// If we're doing high frequency generation, stop randomizing the board now
		this.data.board.stopHighFrequencyRandomize( this.startRound );
	}

	/**
	 * Alias for preareRound
	 */
	this.go = function() {
		this.prepareRound();
	}

	/**
	 * Adds a user to this game
	 * @param {Object} user - The user to add
	 * @param {Boolean} playing - (Optional) If set to true, the user will be added as a player. Otherwise, they will be a spectator.
	 */
	this.addUser = function( user, playing ) {
		if ( typeof user == "object" )
		{
			console.log("Adding user " + user.id + " to game " + this.id);

			// Remove user from other games if they're in any
			if ( user.gameRef )
			{
				user.gameRef.removeUser( user );
			}

			// Set game id to this game
			user.data.joinedId = this.data.id;
			user.gameRef = this;
			user.resetScore();
			if ( typeof playing == "boolean" && playing && ( this.data.allowGuests || user.data.registered ) )
			{
				// For now we're just going to disabled "queued" players and let players join mid-round
				// Playing
				// if ( this.data.round.started )
				// {
				// 	// Add to queued players
				// 	if ( this.users.queued.indexOf( user ) < 0 )
				// 	{
				// 		user.isPlaying = false;
				// 		this.users.queued.push( user );
				// 	}
				// }
				// else
				// {
					// Add to active players
					if ( this.users.playing.indexOf( user ) < 0 )
					{
						user.isPlaying = true;
						this.users.playing.push( user );
					}
				// }
			}
			else
			{
				// Spectating
				if ( this.users.joined.indexOf( user ) < 0 )
				{
					user.isPlaying = false;
					this.users.joined.push( user );
				}
			}

			// Send message to the user's client
			user.connection.send( JSON.stringify({
				action: "onGameEnter"
			}));
			user.connection.send( JSON.stringify({
				action: "onGameUpdate",
				args: {
					game: this.getPublicGameData(),
					users: this.getPublicUserData()
				}
			}));

			// Send short game update to all users
			this.broadcastGameStateShort();

			return true;
		}
		else
		{
			console.log("Game.addUser: argument user wasn't a user");
			return false;
		}
	}

	/**
	 * Removes a user from the game
	 * @param  {Object} user - The user to remove
	 */
	this.removeUser = function( user ) {
		if ( typeof user == "object" )
		{
			var wasJoined = false;
			// Remove the user from any array it's in
			for ( k in this.users )
			{
				for ( var i = 0; i < this.users[k].length; i++ )
				{
					if ( this.users[k][i] == user )
					{
						// Found the player
						wasJoined = true;
						this.users[k].splice( i, 1 );
					}
				}
			}
			if ( wasJoined )
			{
				// Update user's data to remove association from this game
				if ( !!user )
				{
					user.data.joinedId = 0;
					user.gameRef = null;
					user.data.isPlaying = false;
					user.resetScore();
				}

				// If the connection is open, send the user client a message
				user.connection.send( JSON.stringify({
					action: "onGameLeave"
				}));

				// Send short game update to all users
				this.broadcastGameStateShort();
			}
		}	
	}

	/**
	 * Returns public data for this game
	 * @return {Object} Game data object
	 */
	this.getPublicGameData = function() {


		var boardArr = this.data.board.boardArray;

		// If the game hasn't started, we also send the last board array as a solution
		if ( !this.data.round.started ) {
			boardArr = this.data.round.lastBoardArray;
		}
		
		// If the board has nothing in it, send an empty board instead.
		// This should only happen before the game has been initialized the first time
		if ( !boardArr.length )
		{
			for ( var x = 0; x < this.data.boardSize; x++ )
			{
				boardArr[x] = [];
				for ( var y = 0; y < this.data.boardSize; y++ )
				{
					boardArr[x][y] = " ";
				}
			}
		}

		var pubGameData = {
			id: this.id,
			rounds: this.data.rounds,
			initd: this.data.initd,
			name: this.data.name,
			board: boardArr,
			boardSize: this.data.boardSize,
			timeLimit: this.data.timeLimit,
			pauseTimeLimit: this.data.pauseTime,
			ranked: this.data.ranked,
			allowGuests: this.data.allowGuests,
			scoreStyle: this.data.scoreStyle,
			private: this.data.private,
			roundStarted: this.data.round.started,
			roundTime: this.data.round.elapsed,
			paused: this.data.isPaused,
			pauseTime: this.data.pauseElapsed,
			minLettersToScore: this.data.minLettersToScore,
			boardHighFrequency: this.data.boardHighFrequency,
			boardRequireLength: this.data.boardRequireLength,
			boardMinWords: this.data.boardMinWords,
			// We always send the number of words of each length in the solution, just not the actual strings of what they are
			wordCounts: this.data.board.solutionCounts
		}

		// If the game has ended, we also want to send the solution
		if ( !this.data.round.started )
		{
			pubGameData.solution = this.data.round.lastSolution;
			pubGameData.wordCounts = this.data.round.lastSolutionCounts;
		}

		return pubGameData;
	}

	/**
	 * Returns a more concise version of the public game data for lobby / game list view
	 * @return {[type]} [description]
	 */
	this.getPublicGameDataShort = function() {

		var pubGameData = {
			id: this.id,
			name: this.data.name,
			timeLimit: this.data.timeLimit,
			minLettersToScore: this.data.minLettersToScore,
			ranked: this.data.ranked,
			allowGuests: this.data.allowGuests,
			private: this.data.private,
			initd: this.data.initd
		}

		return pubGameData;
	}

	/**
	 * Returns the public data for this game's players
	 * @return {Object} player data object
	 */
	this.getPublicUserData = function() {
		var pubPlayerData = {
			playing: [],		// Playing now
			queued: [],		// Queued to play
			joined: []		// Spectating
		}
		var i =0;
		for ( i = 0; i < this.users.playing.length; i++ )
		{
			var p = this.users.playing[i];
			pubPlayerData.playing.push({
				name: p.data.name,
				registered: p.data.registered,
				// If the round is started, we want to send the score but not the words
				words:  this.data.round.started ? {} : p.data.words, 
				score: p.data.score
			});
		}
		for ( i = 0; i < this.users.queued.length; i++ )
		{
			var p = this.users.queued[i];
			pubPlayerData.queued.push({ 
				name: p.data.name, 
				registered: p.data.registered 
			});
		}
		for ( i = 0; i < this.users.joined.length; i++ )
		{
			var p = this.users.joined[i];
			pubPlayerData.joined.push({
				name: p.data.name, 
				registered: p.data.registered 
			});
		}
		return pubPlayerData;
	}

	/**
	 * Returns a shorter version of the player data for lobby / game list view
	 * Just returns the usernames and whether they're registered or not
	 */
	this.getPublicUserDataShort = function() {
		var pubPlayerDataShort = [];
		var i =0;
		for ( i = 0; i < this.users.playing.length; i++ )
		{
			var p = this.users.playing[i];
			pubPlayerDataShort.push({
				name: p.data.name, 
				registered: p.data.registered 
			});
		}
		for ( i = 0; i < this.users.queued.length; i++ )
		{
			var p = this.users.queued[i];
			pubPlayerDataShort.push({ 
				name: p.data.name, 
				registered: p.data.registered 
			});
		}
		for ( i = 0; i < this.users.joined.length; i++ )
		{
			var p = this.users.joined[i];
			pubPlayerDataShort.push({
				name: p.data.name, 
				registered: p.data.registered 
			});
		}
		return pubPlayerDataShort;
	}

}

