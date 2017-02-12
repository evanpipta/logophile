
module.exports = new Vue( {
	el: "#menu-bar",
	data: Logophile.User,
	computed: {

		/**
		 * The display name for the playercard. Only shows "Guest" if you're a guest, so you don't see the random number after it
		 * @return {String} - the modified string
		 */
		displayUserName: function() {
			return ( this.registered ) ? this.name : "Guest";
		}

	}
} );