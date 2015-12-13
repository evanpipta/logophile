
var Sass = require("node-sass");

/**
 * Automatic SCSS/SASS renderer to use in an express stack. Looks for scss and sass files for any given request to a .css file, then falls back on .css
 * @param  {String} dirbase - The base directory where your scss/sass/css files are stored. They should follow the same file structure as the url. 
 * For example, if the url is example.com/assets/css/main.css, your "dirbase" folder should include "assets/css/main.scss" inside of it.
 */
module.exports = function( dirbase, mode ) {
	return function( req, res, next ) {
		var spliturl = req.url.split("?");
		if ( spliturl[0].substr(-4) == ".css" )
		{
			// console.log("Asking for a .css file");
			res.set("Content-Type", "text/css");
			res.set("Cache-Control", "max-age=1");
			var pathCss = dirbase + spliturl[0];
			var pathSass = dirbase + spliturl[0].replace(".css", ".sass");
			var pathScss = dirbase + spliturl[0].replace(".css", ".scss");
			// Try to render SCSS, then fall back to SASS, then fall back to CSS.
			// I know this is a fugly chain of functions at the moment, deal with it. (╯°□°）╯︵ ┻━┻
			Sass.render({ file: pathScss, outputStyle: mode }, function( err, result ) {
				if ( err ) {
					// console.log( err );
					Sass.render({ file: pathSass, outputStyle: mode }, function( err, result ) {
						if ( err ) {
							// console.log( err );
							Sass.render({ file: pathCss, outputStyle: mode }, function( err, result ) {
								if ( err ) { console.log( err ); next(); }
								else { res.send( result.css ); }
							});
						}
						else { res.send( result.css ); }
					});
				}
				else { res.send( result.css ); }
			});
			// console.log( res.headersSent );
		}
		else
		{
			next();
		}
	}
}