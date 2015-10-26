
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

	var GameInner = new Vue({
		el: "#game-inner",
		data: {
			gameData: GameData,
			userData: User,
			modifierKeys: {
				ctrl: false,
				shift: false
			},
			wordToCheck: "Type Here"
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
			},
			wordInputUp: function( e ) {
				// Reset modifier keys
				this.modifierKeys.shift = ( e.keyCode == 16 ) ? false : this.modifierKeys.shift;
				this.modifierKeys.ctrl = ( e.keyCode == 17 ) ? false : this.modifierKeys.ctrl;
			},
			wordInputFocus: function( e ) {
				this.wordToCheck = "";
			},
			wordInputBlur: function( e ) {
				this.wordToCheck = "Type Here";
			},
			submit: function() {
				console.log("Checking Word: " + this.wordToCheck.toUpperCase() );
				wsClient.action("checkWord", { word: this.wordToCheck.toUpperCase() } )
				this.wordToCheck = "";
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