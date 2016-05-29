var Vue = require( "vue" );
module.exports = new Vue( {

	el: "#menu-bar",

	data: {
		user: Logophile.User,
		showSidebarOnMobile: false,
		showSettingsMenu: false,
		showUserMenu: false,
		windowWidth: 1200,
		// breakpoint should be the same as "$tabletBreakpoint" in main.scss
		sidebarBreakpoint: 1150,
		// Added these in case we want to debounce window resize for performance
		resizeDebounce: 500,
		lastResizeTime: 0
	},

	computed: {
		/**
		 * The display name for the playercard. Only shows "Guest" if you're a guest, so you don't see the random number after it
		 * @return {String} - the modified string
		 */
		displayUserName: function() {
			return ( this.user.registered ) ? this.user.name : "Guest";
		},

		/**
		 * Whether the sidebar shows depends on the window size and on showSidebarMenuMobile
		 */
		showSidebar: function() {
			return ( this.windowWidth > this.sidebarBreakpoint ) ? true : this.showSidebarOnMobile;
		}
	},

	methods: {
		toggleSidebar: function() {
			if ( this.windowWidth <= this.sidebarBreakpoint ) {
				this.showSidebarOnMobile = !this.showSidebarOnMobile;
			}
		},
		toggleSettings: function() {
			this.showSettingsMenu = !this.showSettingsMenu;
			this.showUserMenu = false;
		},
		toggleUserMenu: function() {
			this.showUserMenu = !this.showUserMenu;
			this.showSettingsMenu = false;
		},
		onWindowResize: function() {
			this.windowWidth = window.innerWidth;
		}
	},

	ready: function () {
		window.addEventListener("resize", this.onWindowResize);
		this.windowWidth = window.innerWidth;
	}

} );