var smoosh = require('smoosh');

smoosh
  .config('./config.json')
  .clean() //removes dist directory
  .run() //runs jshint on full build
  .build() //builds both uncompressed and compressed files
  .analyze() //analyzes all
   
//or simply do everything above with
//smoosh.make('./config.json');
