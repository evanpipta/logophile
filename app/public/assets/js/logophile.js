
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

// Main game code
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
	
	GameInner = new Vue({
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
			boardpx: function() {
				// Computed board pixel size
				return Math.max( 300, Math.min( 500, this.gameData.game.board.length*100 - 100 ) );
			},
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
			foundNum: function() {
				return Object.keys( this.userData.words ).length;
			},
			solutionLength: function() {
				return Object.keys( this.gameData.game.solution ).length;
			},
			// The user's found words, sorted by length
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
			// Sorted array of the keys for the sorted user words
			userWordsSortedKeys: function() {
				return Object.keys( this.userWordsSorted ).sort( function( a, b ) { return b - a; } );
			},
			// The count of the remaining words of each length in the board that the user has not found yet
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
			// Sorted keys for user remaining count
			userRemainingCountKeys: function() {
				return Object.keys( this.userRemainingCount ).sort( function( a, b ) { return b - a; } );
			},
			// The solution words, sorted by length
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
			// Return an ordered array of the solution lengths - this way we can select from the object in a specific order
			solutionSortedKeys: function() {
				// Technically objects aren't ordered, but we are going to attempt to do it anyway! Screw you ecma.
				return Object.keys( this.solutionSorted ).sort( function( a, b ) { return b - a; } );
			},
			// Returns the board with cell highlight values specified
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
			startGame: function() {
				console.log("starting game");
				wsClient.action("initGame");
			},
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
			wordInputUp: function( e ) {
				// Reset modifier keys
				this.modifierKeys.shift = ( e.keyCode == 16 ) ? false : this.modifierKeys.shift;
				this.modifierKeys.ctrl = ( e.keyCode == 17 ) ? false : this.modifierKeys.ctrl;
			},
			wordInputFocus: function( e ) {
				this.wordToCheck = "";
				this.wordToHighlight = "";
			},
			wordInputBlur: function( e ) {
				this.wordToCheck = "Type Here";
			},
			submit: function() {
				console.log("Checking Word: " + this.wordToCheck.toUpperCase() );
				wsClient.action("checkWord", { word: this.wordToCheck.toUpperCase() } )
				this.wordToCheck = "";
			},
			// Returns a 2d array of {letter, pos:{ x, y }} for any instances of string w that should be highlighted in the board
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
			userData: User
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