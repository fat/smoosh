/**
  * Adapted shamelessly from emo-coder's jade example
  * but + some smoosh shit.
  * note: use "NODE_ENV=production node app.js" to run app in production
  */

var express = require('express');

var app = express.createServer(
  express.static(__dirname + '/public'),
  function(req, res, next){
    //https://github.com/senchalabs/connect/blob/master/lib/middleware/favicon.js
    //you will check a load url against your source, if it exists, intercept and return minified/ boosh.
    console.log(app.settings.env);
    next();
  }
);

app.set('view engine', 'jade');

var scripts
  , users = [
      { name: 'ded', email: 'dustin@twitter.com' }
    , { name: 'fat', email: 'jacob@twitter.com' }
  ];

app.get('/', function (req, res) {
  res.render('users', { scripts: [], users: users });
});

app.listen(3000);

console.log('Express app started on port 3000');
