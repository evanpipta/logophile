
var FileSystem = require("fs");
var Async = require("async");
var WebSocketServer = require("ws").Server;
var User = require("./user");
var UserList = require("./userlist");
var GameList = require("./gamelist");
var Express = require("express");
var Jade = require("jade");
var Sass = require("node-sass");
var RenderSass = require("./rendersass.js");
var CookieParser = require("cookie-parser");
var PageMap = require("./pagemap");
var PackageInfo = require('../package.json');

module.exports = new function() {

	var self = this;

	/**
	 * Create a new user in the game list with session id and connection attached
	 */
	this.createUser = function( sessId, connection ) {
		// Instantiate a new user using the session id
		var user = UserList.create({ id: sessId });
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
		if ( !!connection.upgradeReq.headers.cookie )
		{
			// Split cookie into an object holding each value
			var cstring = connection.upgradeReq.headers.cookie;
			cstring = cstring.split("; ");
			for ( var i = 0; i < cstring.length; i++ )
			{
				var kv = cstring[i].split("=");
				cookie[ kv[0] ] = kv[1];
			}
		}
		if ( !cookie.sessId )
		{
			console.log("Websocket connection received without session id, closing it.");
			connection.close();
			return;
		}
		console.log( "Request from session ID: " + cookie.sessId );
		console.log( "Currently existing users: " + Object.keys( UserList.users ) );

		// Delete the old user if the same session connects again
		if ( !!UserList.users[ cookie.sessId ] )
		{
			console.log( "Session is already connected, destroying old user" );
			// Find user by id attached to the session
			var user = UserList.getById( cookie.sessId );
			// Close the old connection and remove from userlist
			// We need to make sure we remove the user from the user list first, otherwise we WILL have a problem!!!
			// For some reason this fails:
			// Async.waterfall([
			// 	UserList.remove( user ),
			// 	user.connection.close,
			// 	self.createUser( cookie.sessId, connection )
			// ])
			// But this works:
			user.connection.close();
			setTimeout( function(){ 
				self.createUser( cookie.sessId, connection )
			}, 250 );
		}
		else
		{
			self.createUser( cookie.sessId, connection );
		}

	}

	// Create socket server and bind connection event
	var socketServer = new WebSocketServer( { "port": 8080 } );
	socketServer.on( "connection", function( conn ) {
		self.handleConnection( conn );
	});

	/**
	 * Map requests for actual pages, to handle some redirects and asks the html builder for the correct page type
	 * @return {[type]} [description]
	 */
	this.mapPages = function() {
		for ( path in PageMap ) {

			// Bind get request calback for this url path
			app.get( path, function( req, res ) {

				// Check if session cookie exists
				// console.log( req.cookies );
				var sessId = req.cookies.sessId;
				if ( sessId === undefined )
				{
					// Generate a unique session id to save as a cookie
					newSessId = Math.random().toString();
					newSessId = newSessId.substring( 2, newSessId.length );

					// It's VERY unlikely that two concurrent users would ever get assigned the same session id, but let's just be 100% sure
					while ( !!UserList.users[ newSessId ] )
					{
						// console.log("Session id already exists in users, generating new one.");
						newSessId = Math.random().toString();
						newSessId = newSessId.substring( 2, newSessId.length );
					}

					// Set new cookie
					res.cookie( 'sessId', newSessId, { maxAge: 900000 } );
					// console.log( 'Sesson id created successfully:' + newSessId );
				}
				else
				{
					// Restart cookie age with same value
					res.cookie( 'sessId', sessId, { maxAge: 900000 } );
					// console.log( 'Session id: ' + sessId );
				}

				// Split url into path and query string
				var url = req.url.split("?")[0];

				// Check if the url redirects, and return if so
				if ( !!PageMap[ url ].redirect )
				{
					res.redirect( PageMap[ url ].status, PageMap[ url ].redirect );
					return;
				}

				// Split query string into a params object - we use this for determining what game the user is entering
				// We may use it to determine other things
				var qstring = req.url.split("?")[1];
				var params = {};
				if ( qstring )
				{
					var qstring = qstring.split("&")
					for ( var i = 0; i < qstring.length; i++ )
					{
						var item = qstring[i].split("=");
						var k = item[0], v = item[1];
						// console.log( k + ", " + v );
						params[ k ] = v;
						// console.log( params[ k ] );
					}
				}

				// Populate initial game and game user data if the page we're on points to an active game
				// We only populate initial game data in the http request, not the individual user data
				// Individual user data gets destroyed any time the user loads a new page, and rebuilt when the new websocket connection is opened
				var GameData = {};
				var GameUserData = {};
				if ( PageMap[ url ].type == "game" )
				{
					var gid = parseInt( Object.keys( params )[0] );
					var g = GameList.getById( gid );
					console.log( "Game id: " + gid + " Game exists: " + !!g );
					if ( !g )
					{
						// If the game doesn't exist, return a game doesn't exist page
						res.send( Jade.renderFile( __dirname + "/templates/nogame.jade" , {
							version: PackageInfo.version
						} ) );
						return;
					}
					else
					{
						// Assign game data for output in template
						GameData = g.getPublicGameData();
						UserData = g.getPublicUserData();
					}
				}

				// Send data back
  				// res.send("Page type: " + PageMap[ url ].type + "<br>" + "Query string: " + JSON.stringify( params ) );
  				res.send( Jade.renderFile( __dirname + "/templates/" + PageMap[ url ].type + ".jade", {
  					version: PackageInfo.version,
  					pagetype: PageMap[ url ].type,
  					gamedata: JSON.stringify( GameData ),
  					gameuserdata: JSON.stringify( GameUserData ),
  					pretty: "  "
  				} ) );

			});
		}
	}

	// Create express server and listen for requests
	var app = Express();
	var expressServer = app.listen( 3000, function () {
		var host = expressServer.address().address;
		var port = expressServer.address().port;
		console.log('Server listening at http://' + host + port);
	});

	// Cookie parser
	app.use( CookieParser() );

	// Auto-render any SCSS or SASS to CSS when requesting a .css file
	app.use( RenderSass( __dirname + "/public" ) );

	// Set up static files to serve from the public directory
	var static = Express.static( __dirname + "/public", {
		index: false,
		maxAge: 1,
		setHeaders: function(res, path, stat) {
			// res.set("Content-Type", "text/html");
		}
	});
	app.use( static );

	// Add trailing slashes if they don't exist and there's no filename specified
	app.use( function( req, res, next ) {
		var spliturl = req.url.split("?");
		var urlparts = spliturl[0].split("/");
		if ( urlparts[ urlparts.length-1 ].indexOf(".") > -1 )
		{
			// Filename, go to next
			next();
		}
		else if ( spliturl[0].substr(-1) !== "/" )
		{
			var finalurl = spliturl[0] + "/";
			if ( spliturl.length > 1 && spliturl[1] )
			{
				finalurl += "?" + spliturl[1];
			}
			res.redirect( 301, finalurl );
		}
		else
		{
			next();
		}
	});

	// Map non-static pages
	this.mapPages();

	// 404
	app.use( function( req, res, next ) {
		res.status(404).send( Jade.renderFile( __dirname + "/templates/404.jade" , {
			version: PackageInfo.version
		} ) );
	} );

}