var fs = require('fs')
  , colors = require('colors')
  , uglifyJs = require('uglify-js')
  , jshint = require('jshint').JSHINT
  , asciimo = require('asciimo').Figlet
  , gzip = require('gzip')
  , rimraf = require("rimraf")
  , config = null
  , files = {}
  , minFiles = {}
  , oldFiles = {}
  , oldMinFiles = {}

var _write = {
  
  flushed: false,
  messageQueue: [],
  
  _messages: [],
  _response: [],
  _flushed: false,
  
  message: function(message) {
    if (this._flushed) {
      console.log(message);
    } else {
      this._messages.push(message);
    }
  },
  
  flush: function () {
    if (this._flushed) return;
    this._flushed = true;
    while (this._messages[0]) console.log(this._messages.shift());
  },
  
  welcome: function (callback) {
    this.newLine();
    this.message('smoosh');
    
    var font = 'Banner3'
      , text = 'smoosh'
      , that = this;
    
    asciimo.write(text, font, function(art){
      that._messages[1] = art.rainbow;
      that.flush();
    });
  },
  
  newLine: function () {
    this.message('*********************************************************************\n'.rainbow);
  },
  
  noConfig: function () {
    this.newLine();
    this.message('Whoa! You fucked up... smoosh needs a valid config file!\n'.yellow);
  },
  
  jshint: function(key, errors) {
    if (!errors.length) {

      this.message('+' + ' Congratulations. You are a very special and Handsome person.'.green);
      this.message('  '.green + key.yellow + ' PASSED jshint with no errors!\n');

    } else {

      this.message([
        'Boo!' 
      , '*' + key + '*', 
      , 'FAILED jshint with'
      ,  errors.length
      , 'error' + (errors.length > 1 ? 's' : '') + ':'
      ].join(' ').magenta);

      errors.forEach(function (err) {
       this.message(err.id + " line " + err.line + ": " + err.reason.yellow);
      });
    }
  },
  
  analysis: function (type, file, oldLen, newLen){
    var fileDiff = Math.abs(oldLen - newLen).toString();
    this.message('+ The new size of ' + type.magenta + ' ' + file.magenta + ' is ' + newLen.toString().magenta + ' bytes!');

    if (newLen < oldLen) {
      this.message('  Great job! That\'s '.green + fileDiff + ' bytes less!\n'.green);
    } else if (newLen > oldLen) {
      this.message('  Dude! You made it worse! That\'s '.red + fileDiff + ' bytes more!\n'.red);
    } else {
      this.message('  Not bad. But how does it feel to do all that work and make no difference.\n'.yellow);
    }
  },
  
  built: function (type, file) {
    this.message('+ ' + file.yellow + ' was successfully built as ' + type);
  },
  
  noOldFiles: function (type, key){
    this.message('No old file ' + key + ' of type ' + type + ' to compare against.');
  }
  
};

function setup (path_to_config) {
  /*! PROCESS FILES */
  try {
    config = JSON.parse(fs.readFileSync(path_to_config, 'UTF-8'));
  } catch (e) {
    _write.noConfig();
    return module.exports;
  }
  
  config.DIST_DIR = config.DIST_DIR || 'dir';
  
  for (var key in config.SOURCES) { 
    
    files[key] = config.SOURCES[key].map(function (PATH) {
      return fs.readFileSync(PATH, 'UTF-8');
    }).join('\n');
    
    //check for oldFiles (this is for analysis later)
    try {
      oldFiles[key] = fs.readFileSync(getFileName(key, false), 'UTF-8');
    } catch (e) {}
    try {
      oldMinFiles[key] = fs.readFileSync(getFileName(key, true), 'UTF-8');
    } catch (e) {}
    
  }
  
  return module.exports;
}

/*! RUN (jshint bitches)*/

var _run = {
  
  jshint: function () {
    _write.newLine();
    for (var key in files) {
      var errors = [];
      jshint(files[key], config.JSHINT_OPTS);
      jshint.errors.forEach(function (err) {
        if (err && err.reason != 'Expected an assignment or function call and instead saw an expression.') {
          errors.push(err);
        }
      });
      _write.jshint(key, errors);
    }
  }
  
}

function run (what) {
  if (!config) {
    _write.noConfig();
    return module.exports;
  }
  _run.jshint();
  return module.exports;
}


/*! BUILD FILES */
function getFileName (name, min) {
  return config.DIST_DIR
    + '/' 
    + name 
    + (config.VERSION ? '-' + config.VERSION : '')
    + (min ? '.min' : '')
    + '.js';
}

function show_copyright(comments) {
        var ret = "";
        for (var i = 0; i < comments.length; ++i) {
                var c = comments[i];
                if (c.type == "comment1") {
                        ret += "//" + c.value + "\n";
                } else {
                        ret += "/*" + c.value + "*/";
                }
        }
        return ret + '\n';
};

var _build = {
  
  uglify: function () {
    for (var key in files) {
      var tok = uglifyJs.parser.tokenizer(files[key])
        , c = tok();
        
      minFiles[key] = show_copyright(c.comments_before) || '';
      
      var ast = uglifyJs.parser.parse(files[key]);
      ast = uglifyJs.uglify.ast_mangle(ast);
      ast = uglifyJs.uglify.ast_squeeze(ast);
      
      minFiles[key] += uglifyJs.uglify.gen_code(ast);
      
      fs.writeFileSync(getFileName(key, true), minFiles[key]);
      _write.built('a minified file with uglifyJs', key);
    }
  },
  
  uncompressed: function () {
    for (var key in files) {
      fs.writeFileSync(getFileName(key, false), files[key]);
      _write.built('an uncompressed file', key);
    }
  }
  
};

function build (what) {
  
  if (!config) {
    _write.noConfig();
    return module.exports;
  }
  
  /*! CREATE DIST DIRECTORY IF NOT ALREADY PRESENT */
  try {
    fs.statSync(config.DIST_DIR);
  } catch (e) {
    fs.mkdirSync(config.DIST_DIR, 0775);
  }
  
  _write.newLine();
  
  /*! RUN CORRECT BUILD SCRIPT */
  switch (what && what.toLowerCase()) {
    case 'full':
    case 'uncompressed':
      _build.uncompressed();
      break;
    case 'compressed':
    case 'uglifyjs':  
    case 'min':
      _build.uglify();
      break;
    default:
      _build.uncompressed();
      _build.uglify();
  }
  
  _write.message('\n');
  
  return module.exports;
  
};


/*! ANALYSIS */
var _analyze = {
  
  uncompressed: function(){
    for (var key in files) {
      if (!oldFiles[key]) {
        return _write.noOldFiles('uncompressed', key);
      } else {
      _write.analysis('uncompressed', key, oldFiles[key] && oldFiles[key].length, files[key].length)
      }
    }
  },
  
  compressed: function(){
    for (var key in minFiles) {
      if (!oldMinFiles[key]) {
        _write.noOldFiles('compressed', key);
      } else {
        _write.analysis('compressed', key, oldMinFiles[key] && oldMinFiles[key].length, minFiles[key].length)
      }
    }
  },
  
  gzipped: function(){
    for (var key in files) {
      (function (key) {
        if (!oldMinFiles[key]) {
          return _write.noOldFiles('gzipped', key);
        }
        gzip(oldMinFiles[key], function (err, data) {
          var oldGzipLen = data.length;
          gzip(minFiles[key], function (err, data) {
            var newGzipLen = data.length;
            _write.analysis('gzipped', key, oldGzipLen, newGzipLen)
          });
        })
      }(key));
    }
  }
};

function anaylze (what) {
  
  if (!config) {
    _write.noConfig();
    return module.exports;
  }
  
  _write.newLine();
  _write.message('Analyzing File Sizes...\n'.yellow)
  
  switch (what && what.toLowerCase()) {
    case 'full':
    case 'uncompressed':
      _analyze.uncompressed();
      break;
    case 'compressed':
    case 'uglifyjs':  
    case 'min':
      _analyze.compressed();
      break;
    case 'gzip':
    case 'gzipped':
      _analyze.gzipped();
      break;
    default:
      _analyze.compressed();
      _analyze.uncompressed();
      _analyze.gzipped();
  }
  
  return module.exports;
  
};

function clean () {
  try {
    rimraf.sync(config.DIST_DIR)
  } catch (e) {} //don't freak out if no DIST_DIR yet...
  return module.exports;
}

function make () {
  setup.apply(this, arguments);
  clean();
  run();
  build();
  anaylze();
}

function terminal (args) {
  var flags;
  if (args[0][0] == '-') {
    flags = args[0].replace(/^\-/, '').split('');
  } else {
    flags = [args[0]];
  }
  
  flags.forEach(function(flag) {
    switch (flag) {
      case 'd':
      case 'clean':
        clean();
        break;
      case 'c':
      case 'compressed':
      case 'compress':
      case 'min':
        setup(args[1]);
        build('compressed');
        break;
      case 'f':
      case 'uncompressed':
      case 'uncompress':
      case 'full':
        setup(args[1]);
        build('uncompressed');
        break;
      case 'b':
      case 'build':
        setup(args[1]);
        build();
        break;
      case 'r':
      case 'run':
        setup(args[1]);
        run();
        break;
      case 'm':
      case 'make':
        make(args[1]);
        break;
      case 'a':
        try { anaylze(); } catch (e) {
          _write.message('Something went wrong analyzing your file... are you sure you built something new first?'.red);
        }
        break;
      default:
        make(args[0]);
    }
  });
}

_write.welcome();

module.exports.config = setup;
module.exports.run = run;
module.exports.build = build;
module.exports.analyze = anaylze;
module.exports.clean = clean;
module.exports.make = make;
module.exports.terminal = terminal;