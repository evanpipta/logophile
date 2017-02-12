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