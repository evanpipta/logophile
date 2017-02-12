
// External modules
const express = require('express');
const cookieParser = require('cookie-parser');
const renderSass = require('express-render-sass');

// Websocket server wrapper
// Binds incoming websocket connections to a new or existing user instance
const webSocketWrapper = require('./helpers/web-socket-wrapper');
webSocketWrapper.startServer();

// Config
const package = require('../package');
const routes = require('./config/routes');

const sessionTimeout = 900000;
const port = process.env.PORT || 80;

// Load svgs into memory
// Maybe we can just render them straight by 'including' them in the ejs
let svg = {};
// const svgLoader = require('./helpers/svg-loader');
// svgLoader({
// 	dirname: `${__dirname}/svg`,
// 	done: (svgs) => {
// 		svg = svgs;
// 		console.log('svg icons loaded');
// 	}
// });


const app = express();
app.set('view engine', 'ejs');


// Parse cookies
app.use(cookieParser());


// Render .scss and .sass files to css upon request
// This should be done offline in future for performance
app.use(renderSass(`${__dirname}/public`));


// Serve static files
app.use(express.static(`${__dirname}/public`, { index: false, maxAge: 1 }));


// Session cookie
app.use((req, res, next) => {
	const session = req.cookies.session || Math.random().toString().slice(2) + Date.now().toString();
	res.cookie('session', session, { maxAge: sessionTimeout });
	next();
});


// Side-wide locals
app.use((req, res, next) => {
	res.locals = { package, svg };
	next();
});


// Load all the routes
for (const routeInstance of routes) {
	const controller = require(`./controllers/${routeInstance.name}`);
	app.get(routeInstance.route, controller({ routeInstance, app }));
}


/**
 * Handle 404
 */
app.use((req, res, next) => {
	res.status(404).render('404');
});


/**
 * Start the server
 */
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
