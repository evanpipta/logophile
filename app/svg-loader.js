const defaults = require('defaults');
const fs = require('fs');

/**
 * SVG icon loader
 */
module.exports = function svgLoader(options) {
	const dirname = options.dirname || __dirname + '/svg';
	const done = options.done || function() {};

	// Read directory listing
	const svgsToLoad = fs.readdirSync(dirname);

	// Remove all non-svg filenames
	for (const i in svgsToLoad) {
		const filename = svgsToLoad[i];
		if (!filename.match(/\.svg$/)) {
			delete svgsToLoad[i];
		}
	}

	// Object to load the svg data into
	// The key will be the filename and the value will be the svg data
	// This could potentially take up a lot of memory
	const svgs = {};

	// Load the svgs
	(function loadSvg() {
		if (svgsToLoad.length) {
			const filename = svgsToLoad.shift();
			const fullPath = dirname + '/' + filename;
			// Try to load this icon
			fs.readFile(fullPath, 'utf-8', (err, data) => {
				if (err) return console.log(`Failed to load svg icon ${fullPath}`);
				svgs[filename] = data;
			});
			return loadSvg();
		}

		// If svgsToLoad is empty, do callback
		done(svgs);
	})();
};