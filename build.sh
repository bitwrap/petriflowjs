#!/usr/bin/env bash

# build module
npm run build

# build for browser
./node_modules/.bin/browserify dist.browser/metamodel.js  -o dist.browser/bundle.js -t [ babelify --presets [ @babel/preset-env ] ]
