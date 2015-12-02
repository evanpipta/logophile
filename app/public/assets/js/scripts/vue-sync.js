/**
 * Synchronizes the data between two objects in a Vue-friendly way.
 * @param  {[type]}   data     	- The original data to modify
 * @param  {[type]}   newdata  	- The new data to to insert into the original data
 * @param  {Function} callback 	- (optional) Function to call at the end of syncing all the values
 */
Object.$sync = function( data, newdata, callback, depth ) {

	for ( key in newdata )
	{
		// console.log( "syncing: " + key );
		if ( data instanceof Array && !!data.$set )
		{
			data.$set( key, newdata[ key ] );
		}
		else
		{
			data[ key ] = newdata[ key ];
		}
		if ( data[ key ] instanceof Object )
		{
			Object.$sync( data[ key ], newdata[ key ], callback, true );
		}
	}

	if ( typeof callback == "function" && typeof depth == "undefined" )
	{
		callback();
	}

}
