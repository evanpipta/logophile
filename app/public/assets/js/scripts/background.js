
var Vue = require( "vue" );

module.exports = new Vue( {
	el: "#background",
	data: {
		gameData: Logophile.GameData,
		letters: {
			"A": { weight: 1, color: [230, 115, 38] },
			"B": { weight: 5, color: [235, 215, 98] },
			"C": { weight: 3, color: [243, 146, 232] },
			"D": { weight: 3, color: [49, 44, 216] },
			"E": { weight: 1, color: [110, 218, 9] },
			"F": { weight: 5, color: [235, 186, 60] },
			"G": { weight: 6, color: [167, 40, 146] },
			"H": { weight: 3, color: [213, 115, 58] },
			"I": { weight: 2, color: [24, 223, 190] },
			"J": { weight: 7, color: [29, 240, 14] },
			"K": { weight: 5, color: [232, 177, 10] },
			"L": { weight: 3, color: [164, 111, 244] },
			"M": { weight: 5, color: [194, 17, 147] },
			"N": { weight: 2, color: [245, 99, 250] },
			"O": { weight: 2, color: [0, 173, 212] },
			"P": { weight: 5, color: [29, 226, 187] },
			"Q": { weight: 9, color: [179, 244, 0] },
			"R": { weight: 1, color: [227, 13, 13] },
			"S": { weight: 1, color: [0, 89, 255] },
			"T": { weight: 1, color: [189, 94, 208] },
			"U": { weight: 5, color: [115, 13, 216] },
			"V": { weight: 10, color: [211, 234, 0] },
			"W": { weight: 7, color: [129, 89, 163] },
			"X": { weight: 10, color: [148, 188, 186] },
			"Y": { weight: 5, color: [238, 144, 13] },
			"Z": { weight: 10, color: [210, 15, 227] }
		},
		dominantLetters: {}
	},
	computed: {
		gradients: function() {

			var self = this;

			// Compute dominant letters
			var freq = {};
			this.gameData.game.board.reduce( function( a, b ) { return a.concat(b) } ) .forEach( function( item ) {
				var c = item.letter;
				if ( c ) {
					freq[c] = (freq[c] ? freq[c] : 0) + self.letters[c].weight;
				}
			});

			console.log( freq );

			var dominant = Object.keys( freq ).map( function(i){ return freq[i]+i } ).sort( function(a, b){ return parseInt(a)<parseInt(b) } );

			console.log( dominant );

			var angle = Math.random() * 360;

			return [
				"linear-gradient( "+(angle)+"deg, rgba(0, 190, 218, 0.9) 0%, rgba(33, 143, 149, 0) 85% )",
				"linear-gradient( "+(angle - 80)+"deg, rgba(89, 180, 0, 0.6) 0%, rgba(33, 143, 149, 0) 60% )",
				"linear-gradient( "+(angle - 150)+"deg, rgba(93, 5, 183, 0.2) 0%, rgba(33, 143, 149, 0) 70% )"
			];

		}
	},
	methods: {
	}
} );
