var Vue = require("vue");
module.exports = new Vue({
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
			return Math.max( 300, Math.min( 500, this.gameData.game.board.length * 100 - 100 ) );
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
			});
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
	methods:
	{

		/**
		 * Calls the wsclient's start game action, can be called by any user to initialize the first round
		 */
		startGame: function() {
			console.log("starting game");
			Logophile.wsClient.action("initGame");
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
			console.log("Checking Word: " + this.wordToCheck.toUpperCase() );
			Logophile.wsClient.action("checkWord", {
				word: this.wordToCheck.toUpperCase()
			});
			this.wordToCheck = "";
		}

	}
} );