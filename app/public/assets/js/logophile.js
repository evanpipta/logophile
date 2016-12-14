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

	Logophile.Popup =	 $("#popup-background")[0]	? require( "./scripts/popup.js" ) : null;
	Logophile.MainPage = $("#mainpage")[0] ? require( "./scripts/main-page.js" ) : null;
	Logophile.MenuBar = $("#menu-bar")[0] ? require( "./scripts/menu-bar.js" ) : null;
	Logophile.GameInner = $("#game-inner")[0] ? require( "./scripts/game-inner.js" ) : null;
	Logophile.Sidebar = $("#sidebar")[0] ? require( "./scripts/sidebar.js" ) : null;
	Logophile.GameInfo = $("#game-info")[0] ? require( "./scripts/game-info.js" ) : null;
	
	Logophile.Background = require("./scripts/background.js");

	$( ".tse-scrollable" ).each( function() {
		$( this ).TrackpadScrollEmulator();
	} );

} );
