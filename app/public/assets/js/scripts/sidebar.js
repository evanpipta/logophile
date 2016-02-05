var Vue = require("vue");
require('object-clone');
module.exports = new Vue( {
	el: "#sidebar",
	data:
	{
		gameData: Logophile.GameData,
		userData: Logophile.User,
		boardIsFrozen: false,
		panelSelected: 0,
		markerLeft: 20,
		markerWidth: 78,
		usersFrozen:
		{
			playing: [],
			queued: [],
			joined: []
		}
	},
	computed:
	{

		/**
		 * Array of users playing in the current game, sorted by score
		 * If boardIsFrozen is true, it will return a static list instead of the one from the current model
		 */
		playersSorted: function()
		{
			if ( !this.boardIsFrozen )
			{
				return this.gameData.users.playing.sort( function( a, b )
				{
					return b.score - a.score;
				} );
			}
			else
			{
				return this.usersFrozen.playing.sort( function( a, b )
				{
					return b.score - a.score;
				} );
			}
		},

		/**
		 * Make sure certain properties are deleted from the game info before returning it
		 */
		gameInfo: function()
		{

			// Map user-friendly strings to game variables
			var infoKeys = {
				"name": "Game name",
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

			for ( each in infoKeys )
			{
				infoOut[ infoKeys[ each ] ] = Logophile.GameData.game[ each ];
			}
			
			return infoOut;
		}

	},
	methods:
	{

		/**
		 * Sets boardIsFrozen and sets the board to be equal to the current user data model
		 * @param  {Object} e - DOM event object
		 */
		freezeBoard: function( e )
		{
			if ( !this.boardIsFrozen )
			{
				this.boardIsFrozen = true;

				// Copy the values of this.gameData.users into this.usersFrozen
				// Again, we should really have a working clone function for this, gd
				for ( each in this.gameData.users )
				{
					this.usersFrozen[ each ] = [];
					var list = this.gameData.users[ each ];
					for ( var i = 0; i < list.length; i++ )
					{
						this.usersFrozen[ each ][ i ] = {};
						for ( key in list[ i ] )
						{
							this.usersFrozen[ each ][ i ][ key ] = list[ i ][ key ];
							if ( typeof list[ i ][ key ] == "object" && !( list[ i ][ key ] instanceof Array ) )
							{
								list[ i ][ key ] = {};
								for ( key2 in list[ i ][ key ] )
								{
									this.usersFrozen[ each ][ i ][ key ][ key2 ] = list[ i ][ key2 ];
								}
							}
						}
					}
				}

				console.log( "Freezing board" );
				console.log( JSON.stringify( this.usersFrozen ) );

			}
		},

		/**
		 * Sets boardIsFrozen to false, unless the event came from a child of this.$el
		 * @param  {Object} e - DOM event object
		 */
		unfreezeBoard: function( e )
		{
			// We don't want to unfreeze the board if we're hitting a child element
			var parent = e.toElement || e.relatedTarget;
			var isChild = false;
			while ( parent )
			{
				if ( parent == this.$el )
				{
					// If it's a child, return false
					isChild = true;
					return false;
				}
				parent = parent.parentNode;
			}
			console.log( "Unfreezing board" );
			this.boardIsFrozen = false;
		},

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
