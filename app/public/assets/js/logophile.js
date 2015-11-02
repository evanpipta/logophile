
// Set up game and user state objects
GameData = require("./gamedata");
User = require("./userdata");

// Default game options for creating a new game
GameOptions = require("./gameoptions");

// Set up vue
var Vue = require("vue");
Vue.config.delimiters = ["[[", "]]"];
require("./vuefilters");

// Set up websocket client
var wsClient = require("./wsclient.js");
window.addEventListener("beforeunload", function(){
    wsClient.connection.close();
});

// Start actual client code on load
window.addEventListener("load", function() {

	var Mainpage = new Vue({
 		el: "#mainpage",
 		data: {
 			gameOpts: GameOptions,
	 		openScreen: "",
	 	 	changeScreen: function( s ) {
 				this.openScreen = s;
 			},
 			createGame: function() {
 				// Create a game
 				wsClient.action( "createGame", GameOptions );
 			}
	 	}
	});

	var PlayerCard = new Vue({
		el: "#playercard",
		data: User,
		logout: function() {
			// console.log("Logging out.");
		},
		login: function( email, password ) {
			// console.log("Logging in.");
		}
	});

	var LogoSmall = new Vue({
		el: "#logo-small",
		data: {
			changeScreen: function(s, e) {
				if ( window.location.toString().indexOf("game") < 0 )
				{
					// We only do this if we aren't in a game
					// If we're in a game, it just takes us back to the site root
					e.preventDefault();
					Mainpage.changeScreen( s );
					return false;
				}
			}
		}
	});
	
	/**
	 * The main client-side "game" controller
	 */
	var GameInner = new Vue({
		el: "#game-inner",
		data: {
			gameData: GameData,
			userData: User,
			modifierKeys: {
				ctrl: false,
				shift: false
			},
			wordToCheck: "Type Here",
			wordToHighlight: ""
		},
		computed: {

			/**
			 * The size of the board in pixels, depending on the number of cells
			 * @return {Number} 
			 */
			boardpx: function() {

				return Math.max( 300, Math.min( 500, this.gameData.game.board.length*100 - 100 ) );
			},

			/**
			 * Computed width in percentage of the left column, depending on the board size and whether a round has started or not
			 * @return {String} CSS width value
			 */
			leftColWidth: function() {
				if ( this.gameData.game.roundStarted || this.gameData.game.rounds < 1 )
				{
					return ( this.gameData.game.board.length > 4 ) ? "25%" : "30%";
				}
				else
				{
					return "60px";
				}
			},

			/**
			 * Percentage of words in the solution found by the current user
			 * @return {Number} 0-100
			 */
			foundPercentage: function() {
				var found = Object.keys( this.userData.words ).length;
				var total = 0;
				for ( k in this.gameData.game.wordCounts )
				{
					total += this.gameData.game.wordCounts[ k ];
				}
				total = ( total ) ? total : 1; // Make sure total is >0
				var pct = Math.round( ( found / total ) * 100 );
				return ( pct ) ? pct : 0;
			},

			/**
			 * Number of words found in the solution by the current user
			 * @return {Number}
			 */
			foundNum: function() {

				return Object.keys( this.userData.words ).length;
			},

			/**
			 * The solution length
			 * @return {[type]} [description]
			 */
			solutionLength: function() {

				return Object.keys( this.gameData.game.solution ).length;
			},

			/**
			 * The current user's found words, sorted into lengths. 
			 * For example, userWordsSorted[5] would be an object containing all words the user found of length 5
			 * @return {Object}
			 */
			userWordsSorted: function() {
				var sorted = {};
				var counts = {};
				// Put words in the the object at the index matching their length
				// E.g. wordsSorted[5] will contain all 5 letter words
				for ( var w in this.userData.words )
				{
					var len = w.length;
					if ( !sorted[ len ] )
					{
						// Create a new list in the sorted words using this key's length
						sorted[ len ] = {};
						counts[ len ] = 0;
					}
					sorted[ len ][ w ] = this.userData.words[ w ];
					counts[ len ] += 1;
				}
				return sorted;
			},

			/**
			 * The keys of userWordsSorted, sorted in descending order
			 * @return {Array}
			 */
			userWordsSortedKeys: function() {

				return Object.keys( this.userWordsSorted ).sort( function( a, b ) { return b - a; } );
			},

			/**
			 * The count of the remaining words of each length in the board that the current user has not found yet
			 * @return {Object} Contains keys for each length, and values with the number of words left
			 */
			userRemainingCount: function() {
				var userSorted = this.userWordsSorted;
				var userCounts = {};
				for ( len in userSorted )
				{
					userCounts[ len ] = Object.keys( userSorted[ len ] ).length;
				}
				var remainingCounts = {};
				for ( len in this.gameData.game.wordCounts ) 
				{
					remainingCounts[ len ] = this.gameData.game.wordCounts[ len ];
					if ( !!userCounts[ len ] )
					{
						remainingCounts[ len ] -= userCounts[ len ];
					}
				}
				return remainingCounts;
			},

			/**
			 * Sorted keys for userRemainingCount, descending
			 * @return {Array}
			 */
			userRemainingCountKeys: function() {

				return Object.keys( this.userRemainingCount ).sort( function( a, b ) { return b - a; } );
			},

			/**
			 * The solution words for the current/previous board, sorted into objects by word length
			 * For example, solutionSorted[5] would contain an object whose keys are all the 5 letter words in the board
			 * @return {Object}
			 */
			solutionSorted: function() {

				var sorted = {};
				var counts = {};

				// Put words in the the object at the index matching their length
				// E.g. wordsSorted[5] will contain all 5 letter words
				for ( var w in this.gameData.game.solution )
				{
					var len = w.length;
					if ( !sorted[ len ] )
					{
						// Create a new list in the sorted words using this key's length
						sorted[ len ] = {};
						counts[ len ] = 0;
					}
					sorted[ len ][ w ] = this.gameData.game.solution[ w ];
					counts[ len ] += 1;
				}
				return sorted;
			},

			/**
			 * Sorted keys for solutionSorted, descending
			 * @return {Array}
			 */
			solutionSortedKeys: function() {

				return Object.keys( this.solutionSorted ).sort( function( a, b ) { return b - a; } );
			},

			/**
			 * The board, but including highlighted letters if applicable
			 * @return {Array} 2d board array
			 */
			boardHighlighted: function() {

				// wordToHighlight should probably be set upon input change
				// For now we can just use wordToCheck to test

				var board = this.gameData.game.board;

				// Reset board highlights
				for ( var x = 0; x < board.length; x++ )
				{
					for ( var y = 0; y < board.length; y++ )
					{
						board[x][y].highlight = "";
					}
				}

				var w = this.wordToHighlight;
				if ( this.wordToCheck.length > 0 && this.wordToCheck !== "Type Here" && this.wordToHighlight.length == 0 )
				{
					w = this.wordToCheck;
				}

				// Highlight current sequence if possible
				if ( w.length )
				{
					var highlights = this.getBoardHighlights( w.toUpperCase() );
					for ( var i = 0; i < highlights.length; i++ )
					{
						for ( var j = 0; j < highlights[i].length; j++ )
						{
							var pos = highlights[i][j].pos;
							// This is one letter in the first highlight
							board[ pos.x ][ pos.y ].highlight = "on";
						}
					}
				}

				return board;
			}

		},
		methods: {

			/**
			 * Calls the wsclient's start game action, can be called by any user to initialize the first round
			 */
			startGame: function() {
				console.log("starting game");
				wsClient.action("initGame");
			},

			/**
			 * Handles keydown events from the "word check" input element
			 * @param  {Object} e - The dom event object
			 */
			wordInputDown: function( e ) {
				var k = e.keyCode;
				// Check modifier keys
				this.modifierKeys.shift = ( k == 16 );
				this.modifierKeys.ctrl = ( k == 17 );
				allowed = [
					8,9,16,17,18,20,27,33,34,35,36,45,46,													// modifier keys 
					37,38,39,40,																			// arrow keys 
					65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90, 	// alphabet 
					112,113,114,115,116,117,118,119,120,121,122,123									// f-keys 
				];
				if ( allowed.indexOf( k ) < 0 && !this.modifierKeys.shift && !this.modifierKeys.ctrl )
				{
					// Prevent default for disallowed keys if no modifier keys are pressed with them
					e.preventDefault();
					return false;
				}
				this.wordToHighlight = "";
			},

			/**
			 * Handles keyup events from the "word check" input element
			 * @param  {Object} e - The dom event object
			 */
			wordInputUp: function( e ) {
				// Reset modifier keys
				this.modifierKeys.shift = ( e.keyCode == 16 ) ? false : this.modifierKeys.shift;
				this.modifierKeys.ctrl = ( e.keyCode == 17 ) ? false : this.modifierKeys.ctrl;
			},

			/**
			 * Handles focus events from the "word check" input element
			 * @param  {Object} e - The dom event object
			 */
			wordInputFocus: function( e ) {
				this.wordToCheck = "";
				this.wordToHighlight = "";
			},

			/**
			 * Handles blur events from the "word check" input element
			 * @param  {Object} e - The dom event object
			 */
			wordInputBlur: function( e ) {
				this.wordToCheck = "Type Here";
			},

			/**
			 * Calls the wsclient's action to send a word to be checked/scored
			 */
			submit: function() {
				console.log("Checking Word: " + this.wordToCheck.toUpperCase() );
				wsClient.action("checkWord", { word: this.wordToCheck.toUpperCase() } )
				this.wordToCheck = "";
			},

			/**
			 * Returns a 2D Array whose children are sequences that should be highlighted in the board, depending on w
			 * An example of the return value might look like this:
			 * [ [ {letter: "C", pos: {x: 0, y: 1}}, {letter: "D", pos: {x: 1, y:1}} ] ]
			 *
			 * We return a 2d array, because each item in the outer array is a single sequence, which itself has multiple positions to be highlight
			 * The 2d array may have more than one child if the sequence appears more than once in the same board
			 * Highlighting more than one sequence will be a client side optional feature in the future
			 * 
			 * @param  {String} w - String/word to highlight
			 * @return {Array}   Array of arrays of objects with letter and pos properties
			 */
			getBoardHighlights: function( w ) {

				var board = this.gameData.game.board;
				// Set up word
				var word = w.split("");
				// List of sequences of word found in the board
				var finds = [];

				// Iterate all cells in board
				for ( var x = 0; x < board.length; x++ )
				{
					for ( var y = 0; y < board.length; y++ )
					{
						// Build the sequence starting from this cell
						// This is going to be a little insane, apologies in advance

						// console.log("\nStarting recursive check");
						var positions = [ {x:1,y:-1}, {x:1,y:0}, {x:1,y:1}, {x:0,y:-1}, {x:0,y:1}, {x:-1,y:-1}, {x:-1,y:0}, {x:-1,y:1} ];
						var sequence = (function checkpos( pos, seq, n ) {
							// console.log("Level" + n + "  -  At pos " + JSON.stringify( oldPos ) );
							
							// The letter we're looking for at this level
							var ltr = word[ n ];

							// If n is zero, define the sequence
							if ( n == 0 ) { seq = []; }

							// Add the point at the current level/position
							// We will only get here if (n == 0) or we already checked that the letter exists at this point
							// If (n == 0) we do need to check though
							if ( n > 0 || board[x][y].letter === ltr )
							{
								seq[ n ] = { letter: ltr, pos: pos };
							}

							// If the sequence matches the string, return it
							var seqStr = "";
							for ( var m = 0; m < seq.length; m++ )
							{
								seqStr += seq[ m ].letter;
							}
							// console.log("Level" + n + "  -  String is " + seqStr );
							if ( seqStr === w )
							{
								// console.log("Sequence found ending at " + JSON.stringify( pos ) );
								return seq;
							}

							// If the string is a substring at the start of the word, then we want to check positions around it
							// Checking the match should only be needed if (n == 0)
							if ( !!seqStr && w.match( new RegExp( "^" + seqStr ) ) )
							{
								// console.log( "Level" + n + "  -  " + seqStr + " is a substring of " + w );
								for ( var i = 0; i < 8; i++ )
								{
									// Does the next position contain the next letter from the string?
									var next = { x: pos.x + positions[i].x, y: pos.y + positions[i].y };
									if ( !!board[next.x] && !!board[next.x][next.y] && board[ next.x ][ next.y ].letter == word[ n+1 ] )
									{
										// Is it already in the sequence?
										var inSequence = false;
										for ( var j = 0; j < seq.length; j++ )
										{
											if ( seq[j].pos.x == next.x && seq[j].pos.y == next.y )
											{
												inSequence = true;
												break;
											}
										}
										if ( !inSequence )
										{
											// No, it's unique, so we want to continue the recursion
											seq = checkpos( next, seq, n+1 );

											// If the result of the recursion is the whole string, return it
											var seqStr = "";
											for ( var k = 0; k < seq.length; k++ )
											{
												seqStr += seq[k].letter;
											}
											if ( seqStr === w )
											{
												return seq;
											}
											// Otherwise, the sequence will be the same and we can continue checking other positions
										}
									}
								}
							}
							// console.log("Level" + n + "  -  No viable continuations at " + JSON.stringify( pos ) );

							// No viable letters were found around this position, and it wasn't the full word
							// Then we remove the last letter and return to continue to the next position
							// Or just return an empty sequence if we're on n == 0
							seq.pop();
							return seq;

						}( { x: x, y: y }, [], 0 ) );

						// console.log("Recursion done: " + JSON.stringify( sequence ) );
						if ( sequence.length > 0 ) 
						{
							// Recursion from this cell done
							finds.push( sequence );
							// Skip to end of loop once we find one instance? Comment this out to allow multiple highlights
							// Make this a user option in the future
							x = board.length;
							break;
						}

					}
				}

				// Render the highlights for each find into the board
				// The first one should be full opacity, the rest should be lower

				// Return the board
				return finds;
			}

		}
	});

	var Sidebar = new Vue({
		el: "#sidebar",
		data: {
			gameData: GameData,
			userData: User,
			boardIsFrozen: false,
			usersFrozen: {
				playing: [], 
				queued: [], 
				joined: []
			}
		},
		computed: {

			/**
			 * Array of users playing in the current game, sorted by score
			 * If boardIsFrozen is true, it will return a static list instead of the one from the current model
			 */
			playersSorted: function() {
				if ( !this.boardIsFrozen )
				{
					return this.gameData.users.playing.sort( function( a, b ) { return b.score - a.score; } );
				}
				else
				{
					return this.usersFrozen.playing.sort( function( a, b ) { return b.score - a.score; } );
				}
			}

		},
		methods: {

			/**
			 * Sets boardIsFrozen and sets the board to be equal to the current user data model
			 * @param  {Object} e - DOM event object
			 */
			freezeBoard: function( e ) {
				if ( !this.boardIsFrozen )
				{
					this.boardIsFrozen = true;

					// Copy the values of this.gameData.users into this.usersFrozen
					// Again, we should really have a working clone function for this, gd
					for ( each in this.gameData.users )
					{
						this.usersFrozen[each] = [];
						var list = this.gameData.users[each];
						for ( var i = 0; i < list.length; i++ )
						{
							this.usersFrozen[ each ][ i ] = {};
							for ( key in list[ i ] )
							{
								this.usersFrozen[ each ][ i ][ key ] = list[ i ][ key ];
								if ( typeof list[ i ][ key ] == "object" && !( list[ i ][ key ] instanceof Array ) )
								{
									list[ i ][ key ] = {};
									for ( key2 in list[ i ][ key ] )
									{
										this.usersFrozen[ each ][ i ][ key ][ key2 ] = list[ i ][ key2 ];
									}
								}
							}
						}
					}

					console.log("Freezing board");
					console.log( JSON.stringify( this.usersFrozen ) );

				}
			},

			/**
			 * Sets boardIsFrozen to false, unless the event came from a child of this.$el
			 * @param  {Object} e - DOM event object
			 */
			unfreezeBoard: function( e ) {
				// We don't want to unfreeze the board if we're hitting a child element
				var parent = e.toElement || e.relatedTarget;
				var isChild = false;
				while ( parent )
				{
					if ( parent == this.$el )
					{
						// If it's a child, return false
						isChild = true;
						return false;
					}
					parent = parent.parentNode;
				}
				console.log("Unfreezing board");
				this.boardIsFrozen = false;
			}

		}
	});

	var GameInfo = new Vue({
		el: "#game-info",
		data: {
			gameData: GameData
		},
		methods: {
			startGame: function() {
				console.log("starting game");
				wsClient.action("initGame");
			}
		}
	});
});