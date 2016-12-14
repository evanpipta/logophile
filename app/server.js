var FileSystem = require( "fs" );
var Async = require( "async" );
var WebSocketServer = require( "ws" ).Server;
var User = require( "./user" );
var UserList = require( "./userlist" );
var GameList = require( "./gamelist" );
var Express = require( "express" );
var Jade = require( "jade" );
var Sass = require( "node-sass" );
var RenderSass = require( "express-render-sass" );
var CookieParser = require( "cookie-parser" );
var PageRoutes = require( "./routes" );
var PackageInfo = require( '../package.json' );
var Board = require( "./board" );
var Dictionary = require( './dictionary' );
var SvgLoader = require( './svg-loader' );

var httpPort = process.env.PORT || 80;

module.exports = new function() {

	console.log( "starting server" );

	// Load the svg icons
	var icons = new SvgLoader( {
		svgdir: "/svg",
		callback: () => { console.log( "svg icons loaded" ) }
	} );

	var self = this;

	/**
	 * Create a new user in the game list with session id and connection attached
	 */
	this.createUser = function( sessId, connection ) {
		// Instantiate a new user using the session id
		var user = UserList.create( { id: sessId } );
		user.server = this;
		user.bindConnection( connection );
		console.log( "Creating new user " + sessId );
	}

	/**
	 * Handles a new websocket connection
	 * @param  {Object} connection - the web socket connection
	 */
	this.handleConnection = function( connection ) {

		console.log( "New websocket connection" );

		// Check session cookie
		var cookie = {};
		if ( !!connection.upgradeReq.headers.cookie ) {
			// Split cookie into an object holding each value
			var cstring = connection.upgradeReq.headers.cookie;
			cstring = cstring.split( "; " );
			for ( var i = 0; i < cstring.length; i++ ) {
				var kv = cstring[ i ].split( "=" );
				cookie[ kv[ 0 ] ] = kv[ 1 ];
			}
		}
		if ( !cookie.sessId ) {
			console.log( "Websocket connection received without session id, closing it." );
			connection.close();
			return;
		}
		console.log( "Request from session ID: " + cookie.sessId );
		console.log( "Currently existing users: " + Object.keys( UserList.users ) );

		// If no user exists yet from this session, create one
		if ( !UserList.users[ cookie.sessId ] ) {
			self.createUser( cookie.sessId, connection );
		}
		else {
			// Otherwise bind this connection to the existing user
			UserList.users[ cookie.sessId ].bindConnection( connection );
		}

	}

	// Create socket server and bind connection event
	var socketServer = new WebSocketServer( { "port": 8080 } );
	socketServer.on( "connection", ( conn ) => {
		self.handleConnection( conn );
	});

	/**
	 * Map requests for actual pages, to handle some redirects and asks the html builder for the correct page type
	 * @return {[type]} [description]
	 */
	this.mapPages = function() {
		for ( var path in PageRoutes ) {

			// Bind get request calback for this url path
			app.get( path, function( req, res ) {

				// Check if session cookie exists
				// console.log( req.cookies );
				var sessId = req.cookies.sessId;
				if ( sessId === undefined ) {
					// Generate a unique session id to save as a cookie
					newSessId = Math.random().toString();
					newSessId = newSessId.substring( 2, newSessId.length );

					// It's VERY unlikely that two concurrent users would ever get assigned the same session id, but let's just be 100% sure
					while ( !!UserList.users[ newSessId ] ) {
						// console.log("Session id already exists in users, generating new one.");
						newSessId = Math.random().toString();
						newSessId = newSessId.substring( 2, newSessId.length );
					}

					// Set new cookie
					res.cookie( 'sessId', newSessId, {
						maxAge: 900000
					} );
					// console.log( 'Sesson id created successfully:' + newSessId );
				}
				else {
					// Restart cookie age with same value
					res.cookie( 'sessId', sessId, {
						maxAge: 900000
					} );
					// console.log( 'Session id: ' + sessId );
				}

				// Split url into path and query string
				var url = req.url.split( "?" )[ 0 ];

				// Check if the url redirects, and return if so
				if ( !!PageRoutes[ url ].redirect ) {
					res.redirect( PageRoutes[ url ].status, PageRoutes[ url ].redirect );
					return;
				}

				// Split query string into a params object - we use this for determining what game the user is entering
				// We may use it to determine other things
				var qstring = req.url.split( "?" )[ 1 ];
				var params = {};
				if ( qstring ) {
					console.log( qstring );
					qstring = qstring.split( "#" )[ 0 ];
					qstring = qstring.split( "&" );
					for ( var i = 0; i < qstring.length; i++ ) {
						var item = qstring[ i ].split( "=" );
						var k = item[ 0 ],
							v = item[ 1 ];
						// console.log( k + ", " + v );
						params[ k ] = v;
						// console.log( params[ k ] );
					}
				}

				// Populate initial game and game user data if the page we're on points to an active game
				// We only populate initial game data in the http request, not the individual user data
				// Individual user data gets destroyed any time the user loads a new page, and rebuilt when the new websocket connection is opened
				var GameData = {};
				var UserData = {};
				if ( PageRoutes[ url ].template == "game" ) {
					var gid = parseInt( Object.keys( params )[ 0 ] );
					var g = GameList.getById( gid );
					console.log( "Game id: " + gid + " Game exists: " + !!g );
					if ( !g ) {
						// If the game doesn't exist, return a game doesn't exist page
						res.send( Jade.renderFile( __dirname + "/templates/nogame.jade", {
							version: PackageInfo.version
						} ) );
						return;
					}
					else {
						// Assign game data for output in template
						GameData = g.getPublicGameData();
						UserData = g.getPublicUserData();
					}
				}

				// For the main page, we should do a callback with the board finished
				if ( PageRoutes[ url ].template == "main" ) {

					console.log( "Generating board for main page" );
					// Make sure to include logophile in the board eventually
					// For now just test to make sure we can generate the board properly
					var b = new Board();
					b.randomize( 4, function() {

						console.log( "Sending main page with generated board" );
						res.send( Jade.renderFile( __dirname + "/templates/" + PageRoutes[ url ].template + ".jade", {
							rn: Dictionary.getRandom( Math.round( Math.random() * 9 ) + 3 ) + " " + Dictionary.getRandom( Math.round( Math.random() * 9 ) + 3 ),
							version: PackageInfo.version,
							pagetype: PageRoutes[ url ].template,
							board: JSON.stringify( b.getBoard() ),
							solution: JSON.stringify( b.solution ),
							svg: icons.svg,
							pretty: "  "
						} ) );

					} );

				}
				else {
					// Send data back
					// res.send("Page type: " + PageRoutes[ url ].template + "<br>" + "Query string: " + JSON.stringify( params ) );
					res.send( Jade.renderFile( __dirname + "/templates/" + PageRoutes[ url ].template + ".jade", {
						version: PackageInfo.version,
						pagetype: PageRoutes[ url ].template,
						board: "[[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' '],[' ',' ',' ',' ']]",
						solution: "{}",
						svg: icons.svg,
						pretty: "  "
					} ) );
				}

			} );
		}
	}

	// Create express server and listen for requests
	var app = Express();
	var expressServer = app.listen( httpPort, function() {
		var host = expressServer.address().address;
		var port = expressServer.address().port;
		console.log( 'Server listening at http://' + host + port );
	} );

	// Cookie parser
	app.use( CookieParser() );

	// Auto-render any SCSS or SASS to CSS when requesting a .css file
	app.use( RenderSass( __dirname + "/public" ) );

	// Set up static files to serve from the public directory
	var staticinstance = Express.static( __dirname + "/public", {
		index: false,
		maxAge: 1,
		setHeaders: function( res, path, stat ) {
			// res.set("Content-Type", "text/html");
		}
	} );
	app.use( staticinstance );

	// Add trailing slashes if they don't exist and there's no filename specified
	app.use( function( req, res, next ) {
		var spliturl = req.url.split( "?" );
		var urlparts = spliturl[ 0 ].split( "/" );
		if ( urlparts[ urlparts.length - 1 ].indexOf( "." ) > -1 ) {
			// Filename, go to next
			next();
		}
		else if ( spliturl[ 0 ].substr( -1 ) !== "/" ) {
			var finalurl = spliturl[ 0 ] + "/";
			if ( spliturl.length > 1 && spliturl[ 1 ] ) {
				finalurl += "?" + spliturl[ 1 ];
			}
			res.redirect( 301, finalurl );
		}
		else {
			next();
		}
	} );

	// Map non-static pages
	this.mapPages();

	// 404
	app.use( function( req, res, next ) {
		res.status( 404 ).send( Jade.renderFile( __dirname + "/templates/404.jade", {
			version: PackageInfo.version
		} ) );
	} );

}