
var Defaults = require('defaults');
var Fs = require('fs');

/**
 * SVG icon loader
 */
module.exports = function( options ) {

	// Private options
	var _options = Defaults( options, {
		svgdir: '/svg',
		encoding: 'utf-8',
		callback: function() {}
	});

	// Private data
	var _data = {
		svgsToLoad: Fs.readdirSync( __dirname + _options.svgdir )
	};

	// Public object storing all the loaded SVGs
	this.svg = {}

	// Loads the next svg in _data.svgsToLoad, puts it in this.svg, removes it from svgsToLoad, and calls itself again
	this._loadsvg = function() {

		// console.log("test");

		// Return and call back if svgsToLoad is empty
		if ( !_data.svgsToLoad.length ) {
			_options.callback();
			return;
		}
		else {

			// Otherwise we load the first svg in the array and then call this function again
			var fn = _data.svgsToLoad.shift();
			var fullFn = __dirname + _options.svgdir + '/' + fn;
			var self = this;

			// Try to load this icon
			Fs.readFile( fullFn, _options.encoding, function(err, data) {
				if ( err ) {
					// Log error if it fails
					console.log("Failed to load svg icon " + filename );
				}
				else {
					// Otherwise, put the svg data into the svg object
					self.svg[ fn ] = data;
				}
			} );

			// Load the next one either way
			self._loadsvg();

		}
	};

	// Delete all non-svg filenames
	for ( i in _data.svgsToLoad )
	{
		var filename = _data.svgsToLoad[ i ];
		if ( !filename.match( /\.svg$/ ) )
		{
			delete _data.svgsToLoad[ i ];
		}
	}

	// Start loading svgs
	this._loadsvg();

};
