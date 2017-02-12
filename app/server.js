// modules
const express = require('express');
const cookieParser = require('cookie-parser');
const renderSass = require('express-render-sass');

// Logophile classes
const User = require( "./user" );
const UserList = require( "./userlist" );
const GameList = require( "./gamelist" );
const Board = require( "./board" );
const Dictionary = require( './dictionary' );
const svgLoader = require( './svg-loader' );

// Logophile websocket wrapper
// Binds incoming websocket connections to a new or existing user instance
const webSocketWrapper = require('./web-socket-wrapper.js');
webSocketWrapper.startServer();

// Other
const package = require( '../package.json' );
const routes = require('./routes');

// Session cookie lifetime
const sessionTimeout = 900000;

// http port
const port = process.env.PORT || 80;

// Load svgs into memory
// Maybe we can just render them straight by "including" them in the ejs
let svg;
svgLoader({
	dirname: `${__dirname}/svg`,
	done: (svgs) => {
		svg = svgs;
		console.log('svg icons loaded');
	}
});


// Express stuff
const app = express();


// Parse cookies
app.use(cookieParser());


// Render .scss and .sass files to css upon request
// This should be done offline in future for performance
app.use(renderSass(`${__dirname}/public`));


// Serve static files
app.use(express.static(`${__dirname}/public`, {
	index: false,
	maxAge: 1
}));


// Add trailing slashes to all non-filename requests
app.use((req, res, next) => {
	var spliturl = req.url.split('?');
	var urlparts = spliturl[0].split('/');

	if (urlparts[urlparts.length - 1].indexOf('.') > -1) {
		// Filename, go to next
		next();
	} else if (spliturl[0].substr(-1) !== '/') {
		var finalurl = spliturl[0] + '/';
		if (spliturl.length > 1 && spliturl[1]) {
			finalurl += `?${spliturl[1]}`;
		}
		res.redirect(301, finalurl);
	} else {
		next();
	}
});


// Session cookie
app.use((req, res, next) => {
	const session = req.cookies.session || Math.random().toString().slice(2) + Date.now().toString();
	res.cookie('session', session, { maxAge: sessionTimeout });
	next();
});


// Temp
app.use((req, res, next) => {
	console.log(req.query);
	next();
});


// Populate game data
// app.use((req, res, next) => {

// });


// for (const routeInstance in routes) {

// }

// 				// Populate initial game and game user data if the page we're on points to an active game
// 				// We only populate initial game data in the http request, not the individual user data
// 				// Individual user data gets destroyed any time the user loads a new page, and rebuilt when the new websocket connection is opened
// 				var GameData = {};
// 				var UserData = {};
// 				if (routes[ url ].template == "game") {
// 					var gid = parseInt(Object.keys(params)[0]);
// 					var g = GameList.getById( gid );
// 					console.log( "Game id: " + gid + " Game exists: " + !!g );
// 					if ( !g ) {
// 						res.locals = {
// 							package,
// 							svg: icons.svg
// 						};
// 						res.status(200).render(`nogame.ejs`);
// 						return;
// 					}
// 					else {
// 						// Assign game data for output in template
// 						GameData = g.getPublicGameData();
// 						UserData = g.getPublicUserData();
// 					}
// 				}

// 				if (routes[url].template == 'main') {
// 					// Generate a random board to display on the homepage
// 					console.log('Generating random board for homepage');
// 					var b = new Board();
// 					b.randomize(4, () => {
// 						res.locals = {
// 							package,
// 							rn: `${Dictionary.getRandom(Math.round(Math.random() * 9) + 3)} ${Dictionary.getRandom(Math.round(Math.random() * 9) + 3)}`,
// 							pagetype: routes[url].template,
// 							board: JSON.stringify(b.getBoard()),
// 							solution: JSON.stringify(b.solution),
// 							svg: icons.svg
// 						};
// 						res.status(200).render('homepage.ejs');
// 					});
// 				} else {
// 					res.locals = {
// 						package,
// 						pagetype: routes[url].template,
// 						board: "[[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' ']]",
// 						solution: "{}",
// 						svg: icons.svg
// 					};
// 					res.status(200).render(`${routes[url].template}.ejs`);
// 				}

/**
 * Handle 404
 */
app.use((req, res, next) => {
	res.locals = { package, svg };
	res.status(404).render('404.ejs');
});


/**
 * Start the server
 */
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
