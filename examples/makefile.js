var smoosh = require('../'); // run example on self and not what's installed from npm

smoosh
  .config('./config.json')
  .clean() //removes dist directory
  .run() //runs jshint on full build
  .build() //builds both uncompressed and compressed files
  .analyze() //analyzes all

setTimeout(function() {
  // try as object literal
  smoosh
    .make({
      "VERSION": "0.1",
      "SOURCES": {
        "base": [ "./src/header.js", "./src/script.js" ],
        "secondary": [ "./src/foo.js", "./src/foo.bar.js", "./src/foo.bar.baz.js" ]
      },
      "DIST_DIR": "dist",
      "JSHINT_OPTS": { "boss": true, "forin": true, "browser": true }
    });
}, 1000);
