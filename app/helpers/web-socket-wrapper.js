const WebSocketServer = require('ws').Server;

// user list singleton
const UserList = require('./userlist');

// Websocket port
const port = 8080;


/**
 * Create a new user in the game list with session id and connection attached
 * 
 * @param {string} id 				- user session id, should be stored in cookies.session
 * @param {object} connection - The websocket connection object
 */
function createUser(id, connection) {
	// Instantiate a new user using the session id
	const user = UserList.create({ id });
	user.bindConnection(connection);
}

/**
 * Handles a new websocket connection
 * @param  {Object} connection - the web socket connection
 */
function handleConnection(connection) {
	console.log('Websocket connection request');

	// Parse cookies
	const cookie = {};
	if (connection.upgradeReq.headers.cookie) {
		const cookies = connection.upgradeReq.headers.cookie.split('; ');
		for (let i = 0; i < cookies.length; i++) {
			const kv = cookies[i].split('=');
			cookie[kv[0]] = kv[1];
		}
	}

	// If there's no session cookie, don't connect
	if (!cookie.session) {
		console.log('Websocket connection request missing session cookie, closing it.');
		return connection.close();
	}

	// If no user exists yet from this session, create one
	// Otherwise bind this connection to the existing user
	if (!UserList.users[cookie.session]) {
		console.log(`Creating new user ${cookie.session}`);
		createUser(cookie.session, connection);
	} else {
		console.log(`Binding connection to existing user ${cookie.session}`);
		UserList.users[cookie.session].bindConnection(connection);
	}
}

/**
 * Create the websocket server and start listening
 */
function startServer() {
	const wss = new WebSocketServer({ port });
	wss.on('connection', handleConnection);
	console.log(`Websocket server listening on port ${port}`);
}

module.exports = { startServer };
