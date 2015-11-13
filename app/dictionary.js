
var Fs = require("fs");

/**
 * Dictionary object
 */
module.exports = new function() {

	var dict = this;
	var dictionaryFilename = __dirname + "/CSW.json";
	var encoding = "utf8";
	var loaded = false;

	this.maxlength = 15;	// Longest word length. We can set this manually or automatically, see loadDictionary function
	this.words = {};
	this.subs = {};

	/**
	 * Turns a plain text dictionary file into a json file of words and substrings
	 * The json file is ouput to this.dictionaryFilename
	 * @param  {String} dictTextFile - path to the plain text dictionary file
	 * @return {Boolean}
	 */
	this.preComputeDictionary = function( dictTextFile ) {
		console.time("Output dictionary JSON to " + dictionaryFilename);
		Fs.readFile( dictTextFile, encoding, function( err, data ) {

			if ( err ) { throw err; return; }

			var wordsArr = data.split("\r\n");
			var output = { words: {}, subs: {} }
			for ( var i = 0; i < wordsArr.length; i++ )
			{
				var s = wordsArr[i];
				output.words[s] = s;
				for ( var j = 1; j < wordsArr[i].length; j++ )
				{
					var sub = s.slice(0, j);
					if ( !output.subs[sub] )
					{
						output.subs[sub] = sub;
					}
				}
			}

			Fs.writeFile( dictionaryFilename, JSON.stringify( output ), encoding, function(err) {
				if ( err ) { throw err; return; }
				console.timeEnd("Output dictionary JSON to " + dictionaryFilename);
			});

		});
	}

	/**
	 * Loads a dictionary file into the dict array - this is the JSON version
	 * @return {undefined}
	 */
	this.loadDictionary = function() {
		console.time("Loaded dictionary file");
		// Read the file into fileContents
		Fs.readFile( dictionaryFilename, encoding, function( err, data ) {
			if ( err ) { throw err; return; }
			// File load successful, parse json
			data = JSON.parse( data );
			dict.words = data["words"];
			dict.subs = data["subs"];
			loaded = true;
			console.timeEnd("Loaded dictionary file");
			console.log( Object.keys(dict.words).length + " words and " + Object.keys(dict.subs).length + " substrings");
		});
	}

	/**
	 * Returns a random word from the dictionary optionally at a specific length
	 * @param  {Number} n - (Optional) The random word should be this length
	 * @return {String}
	 */
	this.getRandom = function( n ) {
		var setLength = ( typeof n == "number" )
		var words = [];
		var i = 0;
		for ( w in dict.words )
		{
			// Add all words of the correct length to an array to select from
			if ( !setLength || dict.words[w].length == n )
			{
				words[i] = dict.words[w];
				i++;
			}
		}
		var randomIndex = Math.round( Math.random() * (words.length - 1) );
		return words[randomIndex];
	}

	/**
	 * Check if the dictionary contains a given word
	 * @param  {String} word
	 * @return {Boolean}
	 */
	this.contains = function( word ) {
		return !!dict.words[word];
	}

	/**
	 * Check if the dictionary contains any words starting with this substring
	 * @param  {String} sub 
	 * @return {Boolean}
	 */
	this.containsSub = function( sub ) {
		return !!dict.subs[sub];
	}

	/**
	 * Return the longest word in the loaded dictionary and its length as a number
	 * @return {Object}
	 */
	this.longestWord = function() {
		// This takes roughly 20 ms to execute on my system
		var length = 0;
		var key = "";
		for ( word in dict.words )
		{
			if ( dict.words[word].length > length )
			{
				length = dict.words[word].length;
				key = word;
			}
		}
		return { "word": key, "size": length }
	}


	// Auto-load dictionary json on startup
	this.loadDictionary();

}
