
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

	GameInner = new Vue({
		el: "#game-inner",
		data: {
			gameData: GameData,
			userData: User,
		},
		computed: {
			boardpx: function() {
				// Computed board pixel size
				return Math.max( 300, Math.min( 500, this.gameData.game.board.length*100 - 100 ) );
			}
		},
		methods: {
			startGame: function() {
				console.log("starting game");
				wsClient.action("initGame");
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
		data: GameData,
		methods: {
			startGame: function() {
				console.log("starting game");
				wsClient.action("initGame");
			}
		}
	});
});