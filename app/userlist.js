
var User = require( "./user" );

/**
 * UserList object
 */
module.exports = new function() {

	this.users = {};

	/**
	 * Return a list of all user names
	 * @return {Array} usernames
	 */
	this.getNames = function() {
		var unames = [];
		for ( k in this.users )
		{
			if ( !!this.users[k].data && !!this.users[k].data.name )
			{
				unames.push( this.users[k].data.name );
			}
		}
		return unames;
	}

	/**
	 * Create a new user with a unique id and add it to the list of users
	 * @param  {object} options - (optional) Options to pass to the new user  constructor
	 * @return {object}        The newly created user instance
	 */
	this.create = function( options ) {

		var u = new User( options );

		// If the id set in user options already exists, just replace it
		if ( !!options.id && !!this.users[ options.id ] )
		{
			this.users[ options.id ] == u;
			return u;
		}

		// Generate a new user id until it's unique
		// Honestly we shouldn't ever need this because user ids should be assigned by the sessId cookie
		while ( !!this.users[ u.id ] )
		{
			u.id = Math.random().toString();
			u.id = u.id.substring( 2, u.id.length );
		}
		u.userlist = this;

		// Append user to user list
		this.users[ u.id ] = u;

		return u;

	}

	/**
	 * Remove a user by id
	 */
	this.removeById = function( id ) {
		if ( !!this.users[id] )
		{
			this.users[id] = null;
			delete this.users[id];
		}
	}

	/**
	 * Remove a user by value
	 */
	this.remove = function( user ) {
		for ( var k in this.users )
		{
			if ( this.users[k] === user )
			{
				delete this.users[ user.id ];
				user = null;
			}
		}
	}

	/**
	 * Returns a user by id, if such a user exists
	 * @param  {Number} id - The id of the user to find
	 * @return {Object}    The user instance
	 */
	this.getById = function( id ) {
		return ( !!this.users[id] ) ? this.users[id] : false;
	}

	/**
	 * Gets users by index in the users list
	 * @return {Object} The user instance
	 */
	this.getByIndex = function( index ) {
		var i = 0;
		for ( var k in this.users )
		{
			if ( i == index )
			{
				return this.users[k];
			}
			i++;
		}
		return false;
	}


	this.getByName = function( n ) {
	}

}
