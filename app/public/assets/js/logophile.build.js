(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Global Vue and $
console.log('app running');

// Scrollbar plugin
require('./lib/jquery.trackpad-scroll-emulator.min.js');
require('./scripts/vue-filters');

Vue.config.delimiters = ['[[', ']]'];

// Use Logophile namespace
Logophile.GameOptions = require('./scripts/game-options.js');
Logophile.wsClient = require('./scripts/ws-client.js');
Logophile.BoardHighlighter = require('./scripts/board-highlighter.js');

$(document).ready(() => {

	console.log('ready');

	// Load Vue elements on window loada
	Logophile.Popup = require('./scripts/popup.js');
	Logophile.MainPage = require('./scripts/main-page.js');
	Logophile.PlayerCard = require('./scripts/menu-bar.js');
	Logophile.GameInner = require('./scripts/game-inner.js'); // Main 'game' controllerq 
	Logophile.Sidebar = require('./scripts/sidebar.js');
	Logophile.GameInfo = require('./scripts/game-info.js');

	// Logophile.CanvasRenderer = require('./scripts/canvas-renderer');

	$('.tse-scrollable').each(function() {
		$( this ).TrackpadScrollEmulator();
	});

});

},{"./lib/jquery.trackpad-scroll-emulator.min.js":13,"./scripts/board-highlighter.js":2,"./scripts/game-info.js":3,"./scripts/game-inner.js":4,"./scripts/game-options.js":5,"./scripts/main-page.js":6,"./scripts/menu-bar.js":7,"./scripts/popup.js":8,"./scripts/sidebar.js":9,"./scripts/vue-filters":10,"./scripts/ws-client.js":12}],2:[function(require,module,exports){
/**
 * Returns a 2D Array whose children are sequences that should be highlighted in the board, depending on the word passed
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
module.exports = function( w, board ) {

	// var board = this.gameData.game.board;
	// Set up word
	var word = w.split( "" );
	// List of sequences of word found in the board
	var finds = [];

	// Iterate all cells in board
	for ( var x = 0; x < board.length; x++ ) {
		for ( var y = 0; y < board.length; y++ ) {
			// Build the sequence starting from this cell
			// This is going to be a little insane, apologies in advance

			// console.log("\nStarting recursive check");
			var positions = [ { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 } ];
			var sequence = ( function checkpos( pos, seq, n ) {
			// console.log("Level" + n + "  -  At pos " + JSON.stringify( oldPos ) );

			// The letter we're looking for at this level
			var ltr = word[ n ];

			// If n is zero, define the sequence
			if ( n == 0 ) {
				seq = [];
			}

			// Add the point at the current level/position
			// We will only get here if (n == 0) or we already checked that the letter exists at this point
			// If (n == 0) we do need to check though
			if ( n > 0 || board[ x ][ y ].letter === ltr ) {
				seq[ n ] = {
					letter: ltr,
					pos: pos
				};
			}

			// If the sequence matches the string, return it
			var seqStr = "";
			for ( var m = 0; m < seq.length; m++ ) {
				seqStr += seq[ m ].letter;
			}
			// console.log("Level" + n + "  -  String is " + seqStr );
			if ( seqStr === w ) {
				// console.log("Sequence found ending at " + JSON.stringify( pos ) );
				return seq;
			}

			// If the string is a substring at the start of the word, then we want to check positions around it
			// Checking the match should only be needed if (n == 0)
			if ( !!seqStr && w.match( new RegExp( "^" + seqStr ) ) ) {
				// console.log( "Level" + n + "  -  " + seqStr + " is a substring of " + w );
				for ( var i = 0; i < 8; i++ ) {
					// Does the next position contain the next letter from the string?
					var next = {
						x: pos.x + positions[ i ].x,
						y: pos.y + positions[ i ].y
					};
					if ( !!board[ next.x ] && !!board[ next.x ][ next.y ] && board[ next.x ][ next.y ].letter == word[ n + 1 ] ) {
						// Is it already in the sequence?
						var inSequence = false;
						for ( var j = 0; j < seq.length; j++ ) {
							if ( seq[ j ].pos.x == next.x && seq[ j ].pos.y == next.y ) {
									inSequence = true;
									break;
								}
							}
							if ( !inSequence ) {
								// No, it's unique, so we want to continue the recursion
								seq = checkpos( next, seq, n + 1 );

								// If the result of the recursion is the whole string, return it
								seqStr = "";
								for ( var k = 0; k < seq.length; k++ ) {
									seqStr += seq[ k ].letter;
								}
								if ( seqStr === w ) {
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
			if ( sequence.length > 0 ) {
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
},{}],3:[function(require,module,exports){

module.exports = new Vue( {
	el: "#game-info",
	data: {
		gameData: Logophile.GameData
	},
	methods: {
		/**
		 * Calls the start game action in wsclient
		 * This probably won't be used because there's a big "Start Game" button in the middle of the screen
		 */
		startGame: function() {
			console.log( "starting game" );
			Logophile.wsClient.action( "initGame" );
		}
	}
} );

},{}],4:[function(require,module,exports){
module.exports = new Vue( {
	el: "#game-inner",
	data: {
		gameData: Logophile.GameData,
		userData: Logophile.User,
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
			if ( window.innerWidth > 680 ) {
				return Math.max( 300, Math.min( 500, this.gameData.game.board.length * 100 - 100 ) );
			}
			else {
				return 300;
			}
		},

		/**
		 * Computed width in percentage of the left column, depending on the board size and whether a round has started or not
		 * @return {String} CSS width value
		 */
		leftColWidth: function() {
			if ( this.gameData.game.roundStarted || this.gameData.game.rounds < 1 ) {
				return ( this.gameData.game.board.length > 4 ) ? "25%" : "30%";
			}
			else {
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
			for ( var k in this.gameData.game.wordCounts ) {
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
			for ( var w in this.userData.words ) {
				var len = w.length;
				if ( !sorted[ len ] ) {
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
			return Object.keys( this.userWordsSorted ).sort( function( a, b ) {
				return b - a;
			} );
		},

		/**
		 * The count of the remaining words of each length in the board that the current user has not found yet
		 * @return {Object} Contains keys for each length, and values with the number of words left
		 */
		userRemainingCount: function() {
			var userSorted = this.userWordsSorted;
			var userCounts = {};
			for ( var len in userSorted ) {
				userCounts[ len ] = Object.keys( userSorted[ len ] ).length;
			}
			var remainingCounts = {};
			for ( len in this.gameData.game.wordCounts ) {
				remainingCounts[ len ] = this.gameData.game.wordCounts[ len ];
				if ( !!userCounts[ len ] ) {
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
			return Object.keys( this.userRemainingCount ).sort( function( a, b ) {
				return b - a;
			} );
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
			for ( var w in this.gameData.game.solution ) {
				var len = w.length;
				if ( !sorted[ len ] ) {
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
			return Object.keys( this.solutionSorted ).sort( function( a, b ) {
				return b - a;
			} );
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
			for ( var x = 0; x < board.length; x++ ) {
				for ( var y = 0; y < board.length; y++ ) {
					board[ x ][ y ].highlight = "";
				}
			}

			var w = this.wordToHighlight;
			if ( this.wordToCheck.length > 0 && this.wordToCheck !== "Type Here" && this.wordToHighlight.length == 0 ) {
				w = this.wordToCheck;
			}

			// Highlight current sequence if possible
			if ( w.length ) {
				var highlights = Logophile.BoardHighlighter( w.toUpperCase(), this.gameData.game.board );
				for ( var i = 0; i < highlights.length; i++ ) {
					for ( var j = 0; j < highlights[ i ].length; j++ ) {
						var pos = highlights[ i ][ j ].pos;
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
		 * Touch move event
		 */
		touchmove: function( event ) {
			event.preventDefault();
		},

		/**
		 * Touch start event
		 */
		touchstart: function( event ) {
			event.preventDefault();
		},

		/**
		 * Calls the wsclient's start game action, can be called by any user to initialize the first round
		 */
		startGame: function() {
			console.log( "starting game" );
			Logophile.wsClient.action( "initGame" );
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
				8, 9, 16, 17, 18, 20, 27, 33, 34, 35, 36, 45, 46, // modifier keys 
				37, 38, 39, 40, // arrow keys 
				65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, // alphabet 
				112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123 // f-keys 
			];
			if ( allowed.indexOf( k ) < 0 && !this.modifierKeys.shift && !this.modifierKeys.ctrl ) {
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
			console.log( "Checking Word: " + this.wordToCheck.toUpperCase() );
			Logophile.wsClient.action( "checkWord", {
				word: this.wordToCheck.toUpperCase()
			} );
			this.wordToCheck = "";
		}

	}
} );
},{}],5:[function(require,module,exports){
module.exports = {
	name: {
		val: Logophile.RandomName,
		type: "string",
		valid: true
	},
	boardSize: {
		val: 5,
		type: "number",
		min: 4,
		max: 10,
		valid: true
	},
	frequencies: {
		val: "UNIQUES",
		type: "string",
		valid: true
	},
	timeLimitMinutes: {
		val: 2,
		type: "number",
		min: 1,
		max: 60,
		valid: true
	},
	timeLimitSeconds: {
		val: 0,
		type: "number",
		canBeFalsy: true,
		valid: true
	},
	pauseTime: {
		val: 40,
		type: "number",
		min: 10,
		valid: true
	},
	"private": {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	ranked: {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	scoreStyle: {
		val: "NORMAL",
		type: "string",
		valid: true
	},
	minLettersToScore: {
		val: 4,
		type: "number",
		min: 3,
		max: 7,
		valid: true
	},
	boardHighFrequency: {
		val: false,
		type: "boolean",
		canBeFalsy: true,
		valid: true
	},
	boardMinWords: {
		val: 100,
		type: "number",
		canBeFalsy: true,
		valid: true
	},
	boardRequireLength: {
		val: 10,
		type: "number",
		canBeFalsy: true,
		min: 0,
		max: 13,
		valid: true
	}
}

},{}],6:[function(require,module,exports){
// var Ajax = require( "simple-ajax" );
module.exports = new Vue( {

	el: "#mainpage",
	data: {
		wordToHighlight: "",
		wordToHighlightFull: "", // The full string of the word to highlight
		autoHighlight: {
			keystrokeInterval: 150, // time between "keystrokes"
			wordDisplay: 3000, // time to display words after they've been highlighted
			wordInterval: 300, // time between word displays
			wordStart: 0 // time the current word started being "typed"
		},
		gameOpts: Logophile.GameOptions,
		gameData: Logophile.GameData,
		openScreen: "",
		changeScreen: function( s ) {
			this.openScreen = s;
		}
	},

	computed: {
		/**
		 * The board, but including highlighted letters if applicable
		 * Nearly the same method as the one in GameInner
		 * @return {Array} 2d board array
		 */
		boardHighlighted: function() {
			var board = this.gameData.game.board;
			// Reset board highlights
			for ( var x = 0; x < board.length; x++ ) {
				for ( var y = 0; y < board.length; y++ ) {
					board[ x ][ y ].highlight = "";
				}
			}
			// Highlight current sequence if possible
			if ( this.wordToHighlight.length ) {
				var highlights = Logophile.BoardHighlighter( this.wordToHighlight.toUpperCase(), this.gameData.game.board );
				for ( var i = 0; i < highlights.length; i++ ) {
					for ( var j = 0; j < highlights[ i ].length; j++ ) {
						var pos = highlights[ i ][ j ].pos;
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
		 * Shows the popup with the "create game" options
		 */
		createGamePopup: function() {

			$.ajax({
				url: '/assets/templates/game-options.html',
				method: 'GET',
				success: (data) => {
					if (data) {
						// Create template from response html
						var GameOptionsTemplate = Vue.extend({
							data: function() {
								return {
									parent: Logophile.MainPage
								};
							},
							template: data
						});

						// Do popup
						Logophile.Popup.create({
							buttons: [{
								text: "Create Game",
								click: Logophile.MainPage.createGame
							}],
							title: "New Game Options",
							showCancel: true,
							content: new GameOptionsTemplate(),
						});
					}
				}
			});
			// var ajax = new Ajax( "/assets/templates/game-options.html" );
			// ajax.on( "success", function( event ) {
			// } );
			// ajax.send();

		},

		/**
		 * Highlights words in the board on the homepage at set intervals via setInterval
		 */
		startHighlightTimer: function() {
			if ( typeof Date.now == "function" ) {
				var ksi = this.autoHighlight.keystrokeInterval;
				var wd = this.autoHighlight.wordDisplay;
				var wi = this.autoHighlight.wordInterval;
				var self = this;
				setInterval( function() {

					// console.log("test");

					var time = Date.now();
					var delta = time - self.autoHighlight.wordStart;
					var totalTime = ( !!self.wordToHighlightFull ) ? self.wordToHighlightFull.length * ksi + wd + wi : 0;
					var restart = ( delta > totalTime );
					if ( restart || self.wordToHighlightFull == [] ) {
						self.autoHighlight.wordStart = time;
						// Pick a new random word from the solution
						var words = Object.keys( Logophile.GameData.game.solution );
						self.wordToHighlightFull = words[ Math.floor( Math.random() * words.length ) ];
						self.wordToHighlight = "";
						return;
					}
					self.wordToHighlight = "";

					// Do highlight
					var count = Math.min( Math.round( ( delta - wi ) / ksi ), self.wordToHighlightFull.length );
					if ( count > 0 ) {
						self.wordToHighlight = self.wordToHighlightFull.substr( 0, count );
					}

					// console.log( "Highlighting " + self.wordToHighlight );

				}, ksi );
			}
		},

		/**
		 * Convert GameOptions values to their required type, constrain them to their min/max, and validate them
		 * @return {[type]} [description]
		 */
		validateGameOptions: function() {
			var valid = true;
			for ( var each in this.gameOpts ) {
				// Each value in gameOpts is an object, so "opt" will be a reference to that
				var opt = this.gameOpts[ each ];

				// Do number-specific validation
				if ( opt.type === "number" ) {

					opt.val = ( typeof opt.val === "number" ) ? opt.val : parseInt( opt.val.replace( /[^0-9]/g, "" ) );
					opt.val = ( !!opt.min ) ? Math.max( opt.min, opt.val ) : opt.val;
					opt.val = ( !!opt.max ) ? Math.min( opt.max, opt.val ) : opt.val;

					if ( isNaN( opt.val ) ) {
						opt.val = "";
						opt.valid = valid = false;
					}
				}
				// Then string-specific
				if ( opt.type === "string" && typeof opt.val === "string" ) {
					opt.val = opt.val.replace( /[^A-Z a-z]/g, "" ).toUpperCase().trim();
				}
				// Then general validation
				if ( ( opt.type !== typeof opt.val ) || ( !opt.canBeFalsy && !opt.val ) ) {
					opt.valid = valid = false;
				}
			}
			return valid;
		},

		/**
		 * Validate game options and create a new game if they're valid
		 */
		createGame: function() {
			// Validate game options object
			if ( this.validateGameOptions() ) {
				// Build simplified game options object to pass to the server
				var gameOptionsShort = {};
				for ( var each in Logophile.GameOptions ) {
					gameOptionsShort[ each ] = Logophile.GameOptions[ each ].val;
				}

				// Add the time limit manually
				gameOptionsShort.timeLimit = Logophile.GameOptions.timeLimitMinutes.val * 60 + Logophile.GameOptions.timeLimitSeconds.val;

				console.log( gameOptionsShort );
				Logophile.wsClient.action( "createGame", gameOptionsShort );
			}
		}
	}

} );

module.exports.startHighlightTimer();
},{}],7:[function(require,module,exports){

module.exports = new Vue( {
	el: "#menu-bar",
	data: Logophile.User,
	computed: {

		/**
		 * The display name for the playercard. Only shows "Guest" if you're a guest, so you don't see the random number after it
		 * @return {String} - the modified string
		 */
		displayUserName: function() {
			return ( this.registered ) ? this.name : "Guest";
		}

	}
} );
},{}],8:[function(require,module,exports){

module.exports = new Vue( {
	el: "#popup-background",
	data: {
		title: "",
		showCancel: true,
		showPopup: false,
		buttons: []
	},
	methods: {
		/**
		 * Hides the popup
		 */
		hide: function() {
			this.showPopup = false;
		},

		/**
		 * Shows the popup
		 */
		show: function() {
			this.showPopup = true;
		},

		/**
		 * Hides only if the click came from the target element
		 */
		hideFromTarget: function( e ) {
			if ( e.target.id == this.$el.id ) {
				this.hide();
			}
		},

		/**
		 * Mounts an instance of a Vue component (i.e. made with Vue.extend) in the popup content area
		 * The instance should have a template
		 */
		setContent: function( instance ) {
			instance.$mount( "#popup-content" );
		},

		/**
		 * Wraps all functionality of the popup, allowing creation and display of a new popup
		 */
		create: function( options ) {
			for ( var each in options ) {
				if ( !!this[ each ] ) {
					this[ each ] = options[ each ];
				}
			}
			// console.log("HELLO MOTHERFUCKER?");
			this.title = options.title;
			this.setContent( options.content );
			this.show();
		}
	}

} );
},{}],9:[function(require,module,exports){
module.exports = new Vue( {
	el: "#sidebar",
	data: {
		gameData: Logophile.GameData,
		userData: Logophile.User,
		panelSelected: 0,
		markerLeft: 20,
		markerWidth: 78
	},
	computed: {

		/**
		 * Make sure certain properties are deleted from the game info before returning it
		 */
		gameInfo: function() {

			// Map user-friendly strings to game variables
			var infoKeys = {
				// "name": "Game name",
				"boardSize": "Board size",
				"timeLimit": "Time limit",
				"ranked": "Ranked",
				"scoreStyle": "Scoring mode",
				"private": "Unlisted",
				"minLettersToScore": "Minimum word length to score",
				"boardHighFrequency": "High frequency mode",
				"boardRequireLength": "Include at least one word of length",
				"boardMinWords": "Board minimum total word count",
				"pauseTimeLimit": "Time between rounds",
				"rounds": "Rounds played in this game"
			};
			var infoOut = {};

			for ( var each in infoKeys ) {
				infoOut[ infoKeys[ each ] ] = Logophile.GameData.game[ each ];
			}

			return infoOut;
		}

	},
	methods: {

		/**
		 * Changes the selected panel to display
		 * @param  {Number} n Integer from 0 to 3, which goes from leftmost to rightmost panel as it counts up
		 */
		selectPanel: function( n, event ) {
			this.panelSelected = n;
			// console.log( event.target.tagName );
			this.markerLeft = event.target.offsetLeft;
			this.markerWidth = event.target.offsetWidth;
		}

	}
} );


// Score updater
// We aren't using vue for this because it rebuilds the dom too often while the game is going 
// and you can't hover/click on the user list
$( function() {

	var interval = 1000;
	var list = $( "#scores" );
	if ( list.length ) {

		var scoreUpdater = function() {

			// Update the visible scores
			var elems = $( "#scores li" );
			elems.each( function() {
				var score = $( this ).find( ".score" );
				var user = Logophile.GameData.users.playing[i];
				if ( user ) {
					score.text( user.score );
				}
			} );

			// Re-sort users
			var users = Logophile.GameData.users.playing.sort( function( a, b ) {
				return b.score - a.score;
			} );

			// Build new html
			var sortedHtml = '';
			for ( var i = 0; i < users.length; i++ ) {
				sortedHtml += '<li' + ( ( users[ i ].name === Logophile.User.name ) ? ' class="me">' : '>' );
				sortedHtml += ( i + 1 ) + '. ' + users[ i ].name + '<span class="score">' + users[ i ].score + '</span>';
				sortedHtml += '</li>';
			}

			// If the html is different, replace it
			if ( sortedHtml !== list.html().trim() ) {
				list.html( sortedHtml );
			}

			setTimeout( scoreUpdater, interval );
		}

		scoreUpdater();
	}

} );

},{}],10:[function(require,module,exports){

// Custom vue filters

/**
 * Stringify time filter
 * @param  {Number | String} value
 * @param  {Strig} op - The type of operation to perform. Defaults to "ceil", but we may want to use "floor" if we're counting down instead of up.
 * @return {String}      - A time string in the form of mm:ss or hh:mm, depending on input units)
 */
Vue.filter("time", function( value, op ) {
	// Convert to a number
	op = ( typeof op == "undefined" ) ? "ceil" : op;
	var t = ( typeof value == "string" ) ? parseInt( value ) : Math[op]( value );
	// Split hours/minutes
	var s = t % 60;
	var m = ( t - s ) / 60;
	// Convert to stirng and add 0's
	s = ( s > 9 ) ? s.toString() : "0" + s.toString();
	m = ( m > 9 ) ? m.toString() : "0" + m.toString();
	// Combine the result
	return m+":"+s;
});

/**
 * Filters out entries in an object or array whose key length does not equal len
 * @param  {Object} obj - object or array to filter. if it's an array, the keys are converted to strings
 * @param  {Number} len - length of keys to retain
 * @return {Object}
 */
Vue.filter("keylength", function( obj, len ) {
	if ( typeof obj !== "object" ) { return obj; }
	var output = null;
	if ( obj instanceof Array ) 
	{
		// Array version
		output = [];
		for ( var i = 0; i < obj.length; i++ ) 
		{
			if ( i.toString().length === len ) 
			{
				output.push( obj[i] );
			}
		}
	}
	else 
	{
		// Object version
		for ( var key in obj ) 
		{
			if ( key.length === len ) 
			{
				output[key] = obj[key];
			}
		}
	}
	return output;
});
},{}],11:[function(require,module,exports){
/**
 * Synchronizes the data between two objects in a Vue-friendly way.
 * @param  {[type]}   data     	- The original data to modify
 * @param  {[type]}   newdata  	- The new data to to insert into the original data
 * @param  {Function} callback 	- (optional) Function to call at the end of syncing all the values
 */
Object.$sync = function( data, newdata, callback, depth ) {

	for ( var key in newdata )
	{
		// console.log( "syncing: " + key );
		if ( data instanceof Array && !!data.$set )
		{
			data.$set( key, newdata[ key ] );
		}
		else
		{
			data[ key ] = newdata[ key ];
		}
		if ( data[ key ] instanceof Object )
		{
			Object.$sync( data[ key ], newdata[ key ], callback, true );
		}
	}

	if ( typeof callback == "function" && typeof depth == "undefined" )
	{
		callback();
	}

}

},{}],12:[function(require,module,exports){
require("./vue-sync.js");

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

			var DCMessage = Vue.extend({
				template: '<p class="center">The connection to the game server was closed. You may need to reload the page, or the site may be temporarily down. </p>'
			});

			Logophile.Popup.create( {
				buttons: [],
				title: "Websocket Connection Closed",
				showCancel: false,
				content: new DCMessage()
			} );

		}, 3000 );
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
		 * Synchronizes the GameData model with what was sent in the message
		 * See vuesync.js for more details
		 * @param {Object} args - Should have an identical structure to the GameData model object
		 */
		onGameUpdate: function( args ) {
			// Sync GameData.game and GameData.users separately
			Object.$sync( Logophile.GameData.game, args.game, function() {} );
			Object.$sync( Logophile.GameData.users, args.users, function() {} );
			Object.$sync( Logophile.GameData.usersWithoutScores, args.usersWithoutScores, function() {} );
		},

		/**
		 * Synchronizes the User model with what was sent in the message
		 * See vuesync.js for more details
		 * @param {Object} args - Should have identical structure to the User model object
		 */
		onUserUpdate: function( args ) {

			Object.$sync( Logophile.User, args );
		},


		/**
		 * Reset the user's guessed words, and anything else we need to do at round start
		 * @param {Object} args - Currently not used
		 */
		onRoundStart: function( args ) {
			Logophile.User.words = {};
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

	// Close the connection on window unload
	window.addEventListener("beforeunload", function(){
		self.connection.close();
	});

}

},{"./vue-sync.js":11}],13:[function(require,module,exports){
/*!
 * TrackpadScrollEmulator
 * Version: 1.0.8
 * Author: Jonathan Nicol @f6design
 * https://github.com/jnicol/trackpad-scroll-emulator
 */
!function(a){function b(b,d){function e(){A.hasClass("horizontal")&&(D="horiz",E="scrollLeft",F="width",G="left"),A.prepend('<div class="tse-scrollbar"><div class="drag-handle"></div></div>'),v=A.find(".tse-scrollbar:first"),w=A.find(".drag-handle:first"),d.wrapContent&&B.wrap('<div class="tse-scroll-content" />'),u=A.find(".tse-scroll-content:first"),o(),d.autoHide&&A.on("mouseenter",l),w.on("mousedown",f),v.on("mousedown",i),u.on("scroll",j),k(),a(window).on("resize.trackpadScollEmulator",q),d.autoHide||m()}function f(b){b.preventDefault();var c=b.pageY;"horiz"===D&&(c=b.pageX),x=c-w.offset()[G],a(document).on("mousemove",g),a(document).on("mouseup",h)}function g(a){a.preventDefault();var b=a.pageY;"horiz"===D&&(b=a.pageX);var c=b-v.offset()[G]-x,d=c/v[F](),e=d*B[F]();u[E](e)}function h(){a(document).off("mousemove",g),a(document).off("mouseup",h)}function i(a){if(a.target!==w[0]){var b=C*u[F](),c="vert"===D?a.originalEvent.layerY:a.originalEvent.layerX,d=w.position()[G],e=d>c?u[E]()-b:u[E]()+b;u[E](e)}}function j(){l()}function k(){var a="height"===F?B.outerHeight():B.outerWidth(),b=u[E](),c=v[F](),d=c/a,e=Math.round(d*b)+2,f=Math.floor(d*(c-2))-2;a>c?(w.css("vert"===D?{top:e,height:f}:{left:e,width:f}),v.show()):v.hide()}function l(){k(),m()}function m(){w.addClass("visible"),d.autoHide&&("number"==typeof y&&window.clearTimeout(y),y=window.setTimeout(function(){n()},1e3))}function n(){w.removeClass("visible"),"number"==typeof y&&window.clearTimeout(y)}function o(){"vert"===D?(u.width(A.width()+p()),u.height(A.height())):(u.width(A.width()),u.height(A.height()+p()),B.height(A.height()))}function p(){var b=a('<div class="scrollbar-width-tester" style="width:50px;height:50px;overflow-y:scroll;position:absolute;top:-200px;left:-200px;"><div style="height:100px;"></div>');a("body").append(b);var c=a(b).innerWidth(),d=a("div",b).innerWidth();return b.remove(),c===d&&navigator.userAgent.toLowerCase().indexOf("firefox")>-1?17:c-d}function q(){o(),k()}function r(a,b){return b?void(d[a]=b):d[a]}function s(){B.insertBefore(v),v.remove(),u.remove(),B.css({height:A.height()+"px","overflow-y":"scroll"}),a(window).off("resize.trackpadScollEmulator"),t("onDestroy"),A.removeData("plugin_"+c)}function t(a){void 0!==d[a]&&d[a].call(z)}var u,v,w,x,y,z=b,A=a(b),B=A.find(".tse-content:first"),C=7/8,D="vert",E="scrollTop",F="height",G="top";return d=a.extend({},a.fn[c].defaults,d),e(),{option:r,destroy:s,recalculate:q}}var c="TrackpadScrollEmulator";a.fn[c]=function(d){if("string"==typeof arguments[0]){var e,f=arguments[0],g=Array.prototype.slice.call(arguments,1);return this.each(function(){if(!a.data(this,"plugin_"+c)||"function"!=typeof a.data(this,"plugin_"+c)[f])throw new Error("Method "+f+" does not exist on jQuery."+c);e=a.data(this,"plugin_"+c)[f].apply(this,g)}),void 0!==e?e:this}return"object"!=typeof d&&d?void 0:this.each(function(){a.data(this,"plugin_"+c)||a.data(this,"plugin_"+c,new b(this,d))})},a.fn[c].defaults={onInit:function(){},onDestroy:function(){},wrapContent:!0,autoHide:!0}}(jQuery);
},{}]},{},[1]);
