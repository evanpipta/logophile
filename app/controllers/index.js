const Board = require('../helpers/board.js');
const Dictionary = require('../helpers/dictionary.js');

/**
 * [exports description]
 * @param  {[type]} options [description]
 * @return {[type]}         [description]
 */
module.exports = function indexController(options) {

	return ((req, res, next) => {
		console.log('Generating random board for homepage');

		// Start with low requirements to make sure no time is wasted
		var board = new Board({
			wordLengthRequirement: 3,
			minWords: 10,
			size: 4
		});

		// Respond after a board has been generated
		board.randomize(4, () => {
			res.locals = Object.assign(res.locals, {
				rn:`${Dictionary.getRandom(Math.round(Math.random() * 9) + 3)} ${Dictionary.getRandom(Math.round(Math.random() * 9) + 3)}`,
				board: JSON.stringify(board.getBoard()),
				solution: JSON.stringify(board.solution)
			});

			res.render('index');
		});
	});

};
