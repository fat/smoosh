/**
  * Adapted shamelessly from emo-coder's jade example
  * but + some smoosh shit.
  * note: use "NODE_ENV=production node app.js" to run app in production
  */

var express = require('express')
  // require smoosh and pass config
  , smoosh = require('../../').config('./asset_packages.json');

var app = express.createServer(
  express.static(__dirname + '/public')
);

app.configure('production', function(){
  //build minified packages for production env otherwise serve unminified files
  smoosh.clean().build('min');
});

app.set('view engine', 'jade');

var scripts
  , users = [
      { name: 'ded', email: 'dustin@twitter.com' }
    , { name: 'fat', email: 'jacob@twitter.com' }
  ];


app.get('/', function(req, res){
  //memoize and serve last built scripts || raw sources
  scripts = scripts || smoosh.get('JAVASCRIPT').latest; //or specify smoosh.get('JAVASCRIPT').compressed;
  res.render('users', { scripts: scripts, users: users });
});

app.listen(3000);

console.log('Express app started on port 3000');
