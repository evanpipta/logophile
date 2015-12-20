

module.exports = function( word ) {

	/**
	 * Normal mode for scoring single words
	 * @param  {String} word 
	 * @return {Number}
	 */
	this.NORMAL = function( word ) {
		return Math.round( Math.max( 2.2*word.length - 6, 1 ) );
	}

	/**
	 * Prolific mode - recalculates user word scores depending on how many people found the same word
	 * This should only be used when a round is over
	 * @param {Array} users - Array of users to score against each other
	 */
	this.PROLIFIC = function( users ) {

	}

	// Score with single by default
	if ( typeof word == "string" )
	{
		return this.NORMAL( word );
	}

}
