"use strict";

var Vue = require( "vue" );
var MenuBar = require( "./menu-bar.js" );

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
		},

		show: function() {
			return MenuBar.showSidebar;
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
// We aren't using vue for this because it rebuilds the dom too often while the game is going and you can't hover/click on the user list
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
