/**
 * Sequence class
 */
module.exports = function() {

	/**
	 * points = all positions already in the sequence
	 * @type {Array}
	 */
	this.points = [];

	/**
	 * the letters at all points. only applicable if a board is defined
	 * @type {String}
	 */
	this.letters = "";

	/**
	 *  The board, this will be a 2d array and should be updated by the board this sequences is contained in
	 * @type {Array}
	 */
	this.board = [];

	/**
	 * Adjacent cell positions array
	 * @type {Array}
	 */
	this.adjacent = [
		{ x: 0, y: 1 },
		{ x: 1, y: 1 },
		{ x: 1, y: 0 },
		{ x: 1, y: -1 },
		{ x: 0, y: -1 },
		{ x: -1, y: -1 },
		{ x: -1, y: 0 },
		{ x: -1, y: 1 } 
	 ];

	/**
	 * Adds an adjacent cell, 
	 * @param {Number} index - the adjacent cell's index, starting from (x+0, y+1), going clockwise
	 */
	this.addAdjacent = function( index ) {

		var lastpt = this.points[ this.points.length - 1 ];

		// Same code as addPoint
		// Copying it here instead of calling this.addPoint
		// Simply to reduce the number of function calls used while solving the board
		var pt = {
			x: lastpt.x + this.adjacent[ index ].x,
			y: lastpt.y + this.adjacent[ index ].y
		};

		if ( !!this.board[ pt.y ] && !!this.board[ pt.y ][ pt.x ] && !this.containsPoint( pt ) ) {
			this.points.push( pt ); // Push the position and strip out any members that aren't the x and y coords
			this.letters += this.board[ pt.y ][ pt.x ]; // Add the letter to the string
			return true;
		}
		else {
			return false;
		}
	}

	/**
	 * Adds a point at a random adjacent position, if any are available, and returns true or false depending on whether it was successful
	 */
	this.addRandom = function() {
		var pass = false;
		// We want to keep trying to add a random position even if not all spots are avaialble.
		var numsToTry = [ 0, 1, 2, 3, 4, 5, 6, 7 ];
		while ( numsToTry.length > 0 && !pass ) {
			var rn = Math.round( Math.random() * ( numsToTry.length - 1 ) );
			pass = this.addAdjacent( numsToTry.splice( rn, 1 ) );
		}
		return pass;
	}

	/**
	 * Adds a point to the sequence, returns true if it worked and false if it the position was already used or off the board
	 * @param {Object} pos - The position to add a point at
	 * @return {Boolean}
	 */
	this.addPoint = function( pos ) {
		var pt = {
			x: pos.x,
			y: pos.y
		};
		if ( !!this.board[ pt.y ] && !!this.board[ pt.y ][ pt.x ] && !this.containsPoint( pt ) ) {
			this.points.push( pt ); // Push the position and strip out any members that aren't the x and y coords
			this.letters += this.board[ pt.y ][ pt.x ]; // Add the letter to the string
			return true;
		}
		else {
			return false;
		}
	}

	/**
	 * Remove last point from the list
	 */
	this.removeLast = function() {
		this.letters = this.letters.substring( 0, this.letters.length - 1 ); // Remove last letter
		this.points.pop(); // Remove last point
		return true;
	}

	/**
	 * Returns true or false depending on whether this sequence contains a given point or not
	 * @param  {Object}
	 * @return {Boolean}
	 */
	this.containsPoint = function( pos ) {
		for ( var i = 0; i < this.points.length; i++ ) {
			if ( this.points[ i ].x == pos.x && this.points[ i ].y == pos.y ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Resets the sequence to be empty
	 */
	this.reset = function() {
		this.points = [];
		this.letters = "";
	}

	/**
	 * Start/restart the sequence
	 * @param  {Object} pos - starting position
	 */
	this.start = function( pos ) {
		this.reset();
		this.addPoint( pos );
	}

}