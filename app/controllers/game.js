const GameList = require('../helpers/gamelist');

/**
 * Game middleware controller
 * 
 * @param  {object} options 	 - options object with app and route instance passed in
 * @return {function]}         - express middleware to handle the /game and /game/:id routes
 */
module.exports = function gameController(options) {

	return ((req, res, next) => {
		if (!req.params.id) return res.redirect('/');

		// Get the game instance by id
		const gameInstance = GameList.getById(parseInt(req.params.id, 10));
		console.log(`Game id: ${gameInstance.id} Game exists: ${!!gameInstance}`);

	// If it exists, add values to locals
		if (gameInstance) {
			res.locals = Object.assign(res.locals, {
				board: [[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' ']],
				solution: {},
				GameData: gameInstance.getPublicGameData(),
				UserData: gameInstance.getPublicUserData()
			});
		}

		res.render(gameInstance ? 'game' : 'nogame');
	});

};
