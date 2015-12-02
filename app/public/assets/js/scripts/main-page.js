var Vue = require( "vue" );
module.exports = new Vue(
{
	el: "#mainpage",
	data:
	{
		wordToHighlight: "",
		wordToHighlightFull: "", // The full string of the word to highlight
		autoHighlight:
		{
			keystrokeInterval: 150, // time between "keystrokes"
			wordDisplay: 3000, // time to display words after they've been highlighted
			wordInterval: 300, // time between word displays
			wordStart: 0 // time the current word started being "typed"
		},
		gameOpts: Logophile.GameOptions,
		gameData: Logophile.GameData,
		openScreen: "",
		changeScreen: function( s )
		{
			this.openScreen = s;
		}
	},
	computed:
	{
		/**
		 * The board, but including highlighted letters if applicable
		 * Nearly the same method as the one in GameInner
		 * @return {Array} 2d board array
		 */
		boardHighlighted: function()
		{
			var board = this.gameData.game.board;
			// Reset board highlights
			for ( var x = 0; x < board.length; x++ )
			{
				for ( var y = 0; y < board.length; y++ )
				{
					board[ x ][ y ].highlight = "";
				}
			}
			// Highlight current sequence if possible
			if ( this.wordToHighlight.length )
			{
				var highlights = Logophile.BoardHighlighter( this.wordToHighlight.toUpperCase(), this.gameData.game.board );
				for ( var i = 0; i < highlights.length; i++ )
				{
					for ( var j = 0; j < highlights[ i ].length; j++ )
					{
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
		 * Shows the popup with the "create game" options
		 */
		createGamePopup: function()
		{
			console.log( "create game popup" );
			Logophile.Popup.btns = [
			{
				text: "Create Game",
				click: function()
				{
					Logophile.wsClient.action( "createGame", Logophile.GameOptions );
				}
			} ];
			var GameOptionsView = Vue.extend(
			{
				template: '<div class="game-option">' +
					// '<div class="right">' +
					// '<input type="text" value="Temporary">' +
					// '</div>' +
					// '<p>Game Name:</p>' +
					'</div>'
			} );
			Logophile.Popup.showCancel = true;
			Logophile.Popup.title = "Create New Game";
			Logophile.Popup.setContent( new GameOptionsView() );
			Logophile.Popup.show();
		},

		/**
		 * Highlights words in the board on the homepage at set intervals via setInterval
		 */
		startHighlightTimer: function()
		{
			if ( typeof Date.now == "function" )
			{
				var ksi = this.autoHighlight.keystrokeInterval;
				var wd = this.autoHighlight.wordDisplay;
				var wi = this.autoHighlight.wordInterval;
				var self = this;
				setInterval( function()
				{

					// console.log("test");

					var time = Date.now();
					var delta = time - self.autoHighlight.wordStart;
					var totalTime = ( !!self.wordToHighlightFull ) ? self.wordToHighlightFull.length * ksi + wd + wi : 0;
					var restart = ( delta > totalTime );
					if ( restart || self.wordToHighlightFull == [] )
					{
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
					if ( count > 0 )
					{
						self.wordToHighlight = self.wordToHighlightFull.substr( 0, count );
					}

					// console.log( "Highlighting " + self.wordToHighlight );

				}, ksi );
			}
		}
	}
} );

module.exports.startHighlightTimer();
