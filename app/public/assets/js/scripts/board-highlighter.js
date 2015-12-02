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
module.exports = function( w, board )
{

 	// var board = this.gameData.game.board;
 	// Set up word
 	var word = w.split( "" );
 	// List of sequences of word found in the board
 	var finds = [];

 	// Iterate all cells in board
 	for ( var x = 0; x < board.length; x++ )
 	{
 		for ( var y = 0; y < board.length; y++ )
 		{
 			// Build the sequence starting from this cell
 			// This is going to be a little insane, apologies in advance

 			// console.log("\nStarting recursive check");
 			var positions = [ { x: 1, y: -1 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: -1 }, { x: -1, y: 0 }, { x: -1, y: 1 } ];
 			var sequence = ( function checkpos( pos, seq, n ) {
 				// console.log("Level" + n + "  -  At pos " + JSON.stringify( oldPos ) );

 				// The letter we're looking for at this level
 				var ltr = word[ n ];

 				// If n is zero, define the sequence
 				if ( n == 0 )
 				{
 					seq = [];
 				}

 				// Add the point at the current level/position
 				// We will only get here if (n == 0) or we already checked that the letter exists at this point
 				// If (n == 0) we do need to check though
 				if ( n > 0 || board[ x ][ y ].letter === ltr )
 				{
 					seq[ n ] = {
 						letter: ltr,
 						pos: pos
 					};
 				}

 				// If the sequence matches the string, return it
 				var seqStr = "";
 				for ( var m = 0; m < seq.length; m++ )
 				{
 					seqStr += seq[ m ].letter;
 				}
 				// console.log("Level" + n + "  -  String is " + seqStr );
 				if ( seqStr === w )
 				{
 					// console.log("Sequence found ending at " + JSON.stringify( pos ) );
 					return seq;
 				}

 				// If the string is a substring at the start of the word, then we want to check positions around it
 				// Checking the match should only be needed if (n == 0)
 				if ( !!seqStr && w.match( new RegExp( "^" + seqStr ) ) )
 				{
 					// console.log( "Level" + n + "  -  " + seqStr + " is a substring of " + w );
 					for ( var i = 0; i < 8; i++ )
 					{
 						// Does the next position contain the next letter from the string?
 						var next = {
 							x: pos.x + positions[ i ].x,
 							y: pos.y + positions[ i ].y
 						};
 						if ( !!board[ next.x ] && !!board[ next.x ][ next.y ] && board[ next.x ][ next.y ].letter == word[ n + 1 ] )
 						{
 							// Is it already in the sequence?
 							var inSequence = false;
 							for ( var j = 0; j < seq.length; j++ )
 							{
 								if ( seq[ j ].pos.x == next.x && seq[ j ].pos.y == next.y )
 								{
 									inSequence = true;
 									break;
 								}
 							}
 							if ( !inSequence )
 							{
 								// No, it's unique, so we want to continue the recursion
 								seq = checkpos( next, seq, n + 1 );

 								// If the result of the recursion is the whole string, return it
 								var seqStr = "";
 								for ( var k = 0; k < seq.length; k++ )
 								{
 									seqStr += seq[ k ].letter;
 								}
 								if ( seqStr === w )
 								{
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
 			if ( sequence.length > 0 )
 			{
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