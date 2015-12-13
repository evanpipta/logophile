
module.exports = new function() {

  this.error = false;
  var canvas = document.getElementById("webgl-canvas");
  var gl = null;
  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  }
  catch( e ) {}

  if ( !gl ) {
      this.error = true;
      return;
  }
  else {
    // Set clear color to black, fully opaque
    gl.clearColor( 0.1, 0.1, 0.1, 1.0 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
  }

};
