
// Set up vue
var Vue = require("vue");
Vue.config.delimiters = ["[[", "]]"];
require("./scripts/vue-filters");

// Use logophile namespace
Logophile.GameOptions = require("./scripts/game-options.js");
Logophile.wsClient = require("./scripts/ws-client.js");
Logophile.BoardHighlighter = require("./scripts/board-highlighter.js");

window.addEventListener("load", function() {

  // Load Vue elements on window load
  Logophile.Popup = require("./scripts/popup.js");
  Logophile.MainPage = require("./scripts/main-page.js");
  Logophile.PlayerCard = require("./scripts/player-card.js");
  Logophile.LogoSmall = require("./scripts/logo-small.js");
  Logophile.GameInner = require("./scripts/game-inner.js");	// Main "game" controllerq 
  Logophile.Sidebar = require("./scripts/sidebar.js");
  Logophile.GameInfo = require("./scripts/game-info.js");

  // Logophile.CanvasRenderer = require('./scripts/canvas-renderer');

});
