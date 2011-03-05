//var smoosh = require('smoosh');
var smoosh = require('../');

smoosh
  .config('./config.json')
  .clean() //removes dist directory
  .run() //runs jshint on full build
  .build() //builds both uncompressed and compressed files
  .analyze() //analyzes all
   
//or simply do all to do everything above
//smoosh.make('./config.json');