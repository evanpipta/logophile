
// External modules
const express = require('express');
const cookieParser = require('cookie-parser');
const renderSass = require('express-render-sass');

// Websocket server wrapper
// Binds incoming websocket connections to a new or existing user instance
const webSocketWrapper = require('./helpers/web-socket-wrapper');
webSocketWrapper.startServer();

// Config stuff
const package = require('../package');
const routes = require('./config/routes');

const port = process.env.PORT || 80;

const app = express();
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(renderSass(`${__dirname}/public`));
app.use(express.static(`${__dirname}/public`, { index: false, maxAge: 1 }));

// Session cookie
app.use((req, res, next) => {
	const session = req.cookies.session || Math.random().toString().slice(2) + Date.now().toString();
	res.cookie('session', session, { maxAge: 900000 });
	next();
});

// Side-wide locals
app.use((req, res, next) => {
	res.locals = { package };
	next();
});

// Load all the routes
for (const routeInstance of routes) {
	const controller = require(`./controllers/${routeInstance.name}`);
	app.get(routeInstance.route, controller({ routeInstance, app }));
}

// Handle 404
app.use((req, res, next) => {
	res.status(404).render('404');
});

// Start the server
app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
});
