#!/bin/bash
# Browserify and minify client side js code

#Set up filenames
name=${1%.js*}
buildoutput="$name.build.js"
minoutput="$name.build.min.js"
echo "Building $1 to $minoutput"

#Remove old minify output
rm $minoutput

# Do browserify + minify
browserify $1 -o $buildoutput
minify $buildoutput > $minoutput

#Remove browserify output (obviously this can be commented out if desired)
# rm $buildoutput
