	
var Vue = require("vue");

// Custom vue filters

/**
 * Stringify time filter
 * @param  {Number | String} value
 * @param  {Strig} op - The type of operation to perform. Defaults to "ceil", but we may want to use "floor" if we're counting down instead of up.
 * @return {String}      - A time string in the form of mm:ss or hh:mm, depending on input units)
 */
Vue.filter("time", function( value, op ) {
	// Convert to a number
	op = ( typeof op == "undefined" ) ? "ceil" : op;
	var t = ( typeof value == "string" ) ? parseInt( value ) : Math[op]( value );
	// Split hours/minutes
	var s = t % 60;
	var m = ( t - s ) / 60;
	// Convert to stirng and add 0's
	s = ( s > 9 ) ? s.toString() : "0" + s.toString();
	m = ( m > 9 ) ? m.toString() : "0" + m.toString();
	// Combine the result
	return m+":"+s;
});

/**
 * Filters out entries in an object or array whose key length does not equal len
 * @param  {Object} obj - object or array to filter. if it's an array, the keys are converted to strings
 * @param  {Number} len - length of keys to retain
 * @return {Object}
 */
Vue.filter("keylength", function( obj, len ) {
	if ( typeof obj !== "object" ) { return obj; }
	var output = null;
	if ( obj instanceof Array ) 
	{
		// Array version
		output = [];
		for ( var i = 0; i < obj.length; i++ ) 
		{
			if ( i.toString().length === len ) 
			{
				output.push( obj[i] );
			}
		}
	}
	else 
	{
		// Object version
		for ( key in obj ) 
		{
			if ( key.length === len ) 
			{
				output[key] = obj[key];
			}
		}
	}
	return output;
});