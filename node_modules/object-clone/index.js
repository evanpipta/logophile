
if ( !Object.clone ) {
  Object.defineProperty( Object, "clone", {
    enumerable: false,
    configurable: true,
    writable: true,
    value:  function( obj ) {

      // We return the input value if obj is actually a primitive
      if ( typeof obj !== "object" ) {
        return obj;
      }

      var newObj = new obj.constructor();
      for ( key in obj ) {
        newObj[ key ] = Object.clone( obj[ key ] );
      }

      return newObj;
      
    }

  });
}
