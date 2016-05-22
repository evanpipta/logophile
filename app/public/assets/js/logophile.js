// Jquery
window.$ = window.jQuery = require( "jquery" );

// Scrollbar plugin
require( "./scripts/jquery.trackpad-scroll-emulator.min.js" );

// Vue
var Vue = require( "vue" );
Vue.config.delimiters = [ "[[", "]]" ];
require( "./scripts/vue-filters" );

// Use Logophile namespace
Logophile.GameOptions = require( "./scripts/game-options.js" );
Logophile.wsClient = require( "./scripts/ws-client.js" );
Logophile.BoardHighlighter = require( "./scripts/board-highlighter.js" );

$( document ).ready( function() {

	// Load Vue elements on window loada
	Logophile.Popup = require( "./scripts/popup.js" );
	Logophile.MainPage = require( "./scripts/main-page.js" );
	Logophile.PlayerCard = require( "./scripts/menu-bar.js" );
	Logophile.GameInner = require( "./scripts/game-inner.js" ); // Main "game" controllerq 
	Logophile.Sidebar = require( "./scripts/sidebar.js" );
	Logophile.GameInfo = require( "./scripts/game-info.js" );

	// Logophile.CanvasRenderer = require('./scripts/canvas-renderer');

	$( ".tse-scrollable" ).each( function() {
		$( this ).TrackpadScrollEmulator();
	} );

} );