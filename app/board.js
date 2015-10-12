var Dictionary = require( "./dictionary" );
var Sequence = require( "./sequence" );
var Frequencies = require( "./frequencies" );
var Score = require( "./score" );

/**
 * Board class
 * @param {Number} size - board size 
 */
module.exports = function( size )
{

	// keys are the letters and values are their frequency
	this.letters = Frequencies["Uniques"];

	// All the words in the board
	this.solution = {};

	// All words in the board sorted by length
	this.solutionSorted = {};

	this.boardSize = typeof size == "number" ? size : 4;
	this.boardArray = [];
	this.bonusword = "";

	// Best board generated
	this.bestBoard = [];
	this.bestSolution = {};
	this.bestSolutionLength = 0;
	this.boardsChecked = 0;
	this.bestMinWordLength = 0;
	this.isRandomizing = false;

	// Boards being generated must have at least one word with this length to be used
	this.wordLengthRequirement = 9;

	// Minimum word requirement
	this.minWords = 0;

	// The game this board is part of, if any
	this.gameRef = null;

	// Minimum number of letters to include a word in the solution
	this.minLettersToScore = 4;

	/**
	 * Return a kv object where letter frequencies are points from 0 to 1 corresponding to their percentage of the summed frequency weights
	 * So e.g. if the board's frequencies are {"A": 100, "B": 300, "C": 100}, it would return {"A": 0, "B": 0.2, "C": 0.8}
	 * @return {Object}
	 */
	this.weightedLetterFrequency = function()
	{
		var sum = 0;
		var summed = {};
		for ( k in this.letters )
		{
			// Ignore longer keys storing data that isn't a single letter
			if ( k.length == 1 )
			{
				sum += this.letters[ k ];
				summed[ k ] = sum;
			}
		}
		for ( k in summed )
		{
			summed[ k ] = summed[ k ] / sum;
		}
		return summed;
	}

	/**
	 * Returns a random letter with weighted frequency
	 * @return {String}
	 */
	this.randomLetter = function()
	{
		var weighted = this.weightedLetterFrequency();
		var r = Math.random();
		for ( letter in weighted )
		{
			if ( weighted[ letter ] > r )
			{
				return letter;
			}
		}
	}

	/**
	 * Randomize the board
	 */
	this.randomize = function( size, callback )
	{

		this.boardSize = typeof size == "number" ? size : this.boardSize;
		this.boardArray = [];
		for ( var i = 0; i < this.boardSize; i++ )
		{
			this.boardArray[ i ] = [];
			for ( var j = 0; j < this.boardSize; j++ )
			{
				this.boardArray[ i ][ j ] = this.randomLetter();
			}
		}

		this.solve();
		this.solutionLength = Object.keys( this.solution ).length;
		this.boardsChecked++;

		// If the frequency object has minWords defined, we throw away any boards that don't meet the minimum number of words
		// For smaller board sizes (4, 5), we can push the minimum way up since they generate so fast
		// This will alter the output frequencies, boards with letters like X, Q, Z will be much less common
		// Clamp this between 0 and a value depending on board size so we can't get stuck in an infinite loop
		var min = Math.max( 0, this.minWords );
		min = Math.min( min, ( Math.pow( 1.5*this.boardSize, 1.1 ) - 2.8 ) * 100 );
		if ( this.solutionLength < min )
		{
			// console.log("not enough words, randomizing again");
			// Too few words, randomize again
			this.randomize( size, callback );
			return;
		}

		// If the word length requirement isn't met, throw away the board and generate a ne wone
		// e.g. if the word length requirement is 9, and the board's longest word is 8, we trash it
		var longest = 0;
		for ( var k in this.solution )
		{
			if ( k.length > longest )
			{
				longest = k.length;
			}
		}
		// Set a cap on the word length requirement to avoid infinite looping, this will depend on on board size
		var worthLengthMaxReq = Math.min( 6 + boardSize, 15 );
		if ( longest < Math.min( worthLengthMaxReq, this.wordLengthRequirement ) )
		{
			// Longest word is too short, randomizing again
			this.randomize( size, callback );
			return;
		}

		// Final board generated, do callback
		// console.log( this.boardArray );
		if ( typeof callback == "function" )
		{
			callback( this.gameRef );
		}

	}

	/**
	 * Sort solution by word lengths
	 */
	this.sortSolution = function()
	{

		// Reset sorted solution
		this.solutionSorted = {};

		// Put words in the the object at the index matching their length
		// E.g. wordsSorted[5] will contain all 5 letter words
		for ( var w in this.solution )
		{
			if ( !!this.solutionSorted[ w.length ] )
			{
				// Create a new list in the sorted words using this key's length
				this.solutionSorted[ w.length ] = {};
			}
			this.solutionSorted[ w.length ][ w ] = this.solution[ w ];
		}
	}

	/**
	 * Gets a count of each word length in the sorted solution
	 * @return {Object} - key == word length, value == number of words of that length
	 */
	this.getSortedSolutionCounts = function() {
		var lengths = {};
		for ( len in this.solutionSorted )
		{
			lengths[ len ] = Object.keys( this.solutionSorted[ len ] ).length;
		}
		return lengths;
	}

	/**
	 * Generates the best board possible in the given amount of time
	 * If the "high frequency" option is selected for a game, this will be run for the duration of the pauses between rounds
	 * And the game will use the highest frequency board found in that time
	 */
	this.startHighFrequencyRandomize = function( size, timeLimit, callback )
	{

		this.isRandomizing = true;

		// Reset best board
		this.bestBoard = [];
		this.bestSolution = {};
		this.bestSolutionLength = 0;
		this.boardsChecked = 0;

		// Word length requirement
		this.bestMinWordLength = 0;

		// var board = require("/home/snow/Documents/Logothete/src/app/board.js")
		var startTime = Date.now() / 1000;

		var self = this;
		this.tid = setInterval( function()
		{

			if ( Date.now() / 1000 - startTime < timeLimit )
			{

				self.boardSize = typeof size == "number" ? size : self.boardSize;
				self.boardArray = [];
				for ( var i = 0; i < self.boardSize; i++ )
				{
					self.boardArray[ i ] = [];
					for ( var j = 0; j < self.boardSize; j++ )
					{
						self.boardArray[ i ][ j ] = self.randomLetter();
					}
				}

				self.solve();
				self.solutionLength = Object.keys( self.solution ).length;
				self.boardsChecked++;

				// If the word letter requirement isn't met, throw away the board
				var longest = 0;
				for ( var k in self.solution )
				{
					if ( k.length > longest )
					{
						longest = k.length;
					}
				}
				if ( longest < self.wordLengthRequirement )
				{
					// Longest word is too short, randomizing again
					return;
				}
				else if ( self.solutionLength > self.bestSolutionLength )
				{
					// Longest word is met and the board has the most words, keep it
					self.bestMinWordLength = longest;
					// Last generated board is the best, replace it
					self.bestBoard = self.boardArray;
					self.bestSolution = self.solution;
					self.bestSolutionLength = self.solutionLength;
				}
			}
			else
			{
				// clearInterval( tid );
				// self.stopHighFrequencyRandomize( callback );
			}
		}, 5 );
	}

	/**
	 * Stops the interval for the high frequency randomization
	 * @param  {Function} callback [description]
	 * @return {[type]}            [description]
	 */
	this.stopHighFrequencyRandomize = function( callback )
	{
		if ( !this.isRandomizing )
		{
			return false;
		}
		this.isRandomizing = false;
		clearInterval( this.tid );
		// Set the board/solution the best one found
		this.boardArray = this.bestBoard;
		this.solution = this.bestSolution;
		this.solutionLength = this.bestSolutionLength;

		console.log( "Best board found: " + this.solutionLength + " words " + " out of " + this.boardsChecked + " checked." );
		console.log( this.boardArray );

		if ( typeof callback == "function" )
		{
			callback( this.gameRef );
		}
	}

	/**
	 * Adds a bonus word to the board
	 */
	this.addBonusword = function()
	{
		Dictionary.getRandom( 12 );
	}

	/**
	 * Solve the entire board and store all words in the solution object
	 */
	this.solve = function()
	{

		// console.time( "solve time" );

		// Reset solution (from past boards etc.)
		this.solution = {};

		//Solve all sequences starting with each cell in the board
		for ( var posX = 0; posX < this.boardSize; posX++ )
		{
			for ( var posY = 0; posY < this.boardSize; posY++ )
			{
				var seq = new Sequence();
				seq.board = this.boardArray;
				seq.start(
				{
					x: posX,
					y: posY
				} );
				this.solveSequence( 1, seq );
			}
		}

		this.sortSolution();

		// console.log( Object.keys( this.solution ).length + " words found" );
		// console.timeEnd( "solve time" );

	}

	/**
	 * Finds and adds all possible solutions stemming from a particular sequence
	 * level arg indicates the number of letters already in the sequence
	 * If we're solving on level "3" for example, that means there are 3 letters in the sequence and we're checking all possible 4 letter sequences following it
	 * 
	 * @param  {Number} level - The current level we're on, should start at 1 if you want to solve every sequence from a particular cell
	 * @param  {Object} lastSeq - The sequence to start with
	 */
	this.solveSequence = function( level, lastSeq )
	{

		// Clone sequence
		// Have to clone the array inside of sequence too, otherwise it will just be a reference to the original
		// *** We should really find or write a working deep clone method instead of having this code here ***
		var seq = new Sequence();
		for ( each in lastSeq )
		{
			seq[ each ] = lastSeq[ each ];
		}
		seq.points = [];
		for ( var i = 0; i < lastSeq.points.length; i++ )
		{
			seq.points[ i ] = lastSeq.points[ i ];
		}

		// Iterate all adjacent cells on this level
		for ( var i = 0; i < 8; i++ )
		{
			// If extra point(s) already exists at this level from a previous iteration, remove it(them)
			while ( seq.letters.length > level )
			{
				seq.removeLast();
			}

			// Try to add point at next position on this level
			if ( seq.addAdjacent( i ) )
			{
				var found = !!Dictionary.words[ seq.letters ];
				var sub = !!Dictionary.subs[ seq.letters ];
				if ( found && seq.letters.length >= this.minLettersToScore )
				{
					// We can score the word as we add it to the solution
					this.solution[ seq.letters ] = Score( seq.letters );
				}
				if ( sub ) //&& level < Dictionary.maxlength - 1 )
				{
					this.solveSequence( level + 1, seq );
				}
			}
		}
	}

	/**
	 * Check if a word is in the full solution
	 * @param  {String} word
	 * @return {Boolean|String} returns false if the word doesn't exist, the word as a string if it does
	 */
	this.check = function( word )
	{
		return ( !!this.solution[ word ] ) ? word : false;
	}

	// Automatically randomize at startup?
	// this.randomize();

	return true;

}