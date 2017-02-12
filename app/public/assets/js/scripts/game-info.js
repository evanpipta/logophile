
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
