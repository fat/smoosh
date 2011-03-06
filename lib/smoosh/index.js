var fs = require('fs'),
    colors = require('colors'),
    uglifyJs = require('uglify-js'),
    jshint = require('jshint').JSHINT,
    asciimo = require('asciimo').Figlet,
    gzip = require('gzip'),
    rimraf = require("rimraf");

/**
  * _FILES OBJ IS FILES YOU. Yup.
  */

var _files = {
  JAVASCRIPT: {},
  JAVASCRIPT_MIN: {},
  JAVASCRIPT_MIN_OLD: {},
  CSS: {},
  CSS_MIN: {},
  CSS_MIN_OLD: {}
};



/**
  * _WRITE OBJ IS _WRITE YOU.
  */

var _write = {

  flushed: false,
  messageQueue: [],
  welcomed: false,

  _messages: [],
  _response: [],
  _flushed: false,

  message: function(message) {
    if (_config.config.SILENT) return;
    if (this._flushed) {
      console.log(message);
    } else {
      this._messages.push(message);
    }
  },

  flush: function () {
    if (this._flushed) return;
    this._flushed = true;
    while (this._messages[0]) this.message(this._messages.shift());
  },

  welcome: function (callback) {
    if (this.welcomed) return callback && callback();
    this.welcomed = true;
    this.newLine();
    this.message('smoosh');

    var font = 'Banner3',
        text = 'smoosh',
        that = this;

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
      this.message('+' + ' Congratulations. You are the perfect JavaScripter.'.green);
      this.message('  '.green + key.yellow + ' PASSED jshint with no errors!\n');
    } else {
      this.message([
        'Boo!',
        '*' + key + '*',
        'FAILED JSHint with',
         errors.length,
        'error' + (errors.length > 1 ? 's' : '') + ':'
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



/**
  * _CONFIG OBJ IS _CONFIG YOU.
  */

var _CONFIG = {

  config: null,
  DIST_DIR: null

  init: function (path_to_config) {
    try {
      this.config = typeof path_to_config == 'string' ?
        JSON.parse(fs.readFileSync(path_to_config, 'UTF-8')) : // JSON FILE
        path_to_config; // { literal }
    } catch (e) {
      _write.noConfig();
      return _API;
    }

    this.setDistDir('JAVASCRIPT', 'dist');
    this.setDistDir('CSS', 'dist/css');

    this.process('JAVASCRIPT');
    this.process('CSS');

    return module.exports;
  },

  setDistDir: function (who, default) {
    if (this.config[who] && this.config[who].DIST_DIR) {
      this.DIST_DIR[who] = this.config[who].DIST_DIR;
      delete this.config[who].DIST_DIR;
    } else {
      this.DIST_DIR[who] = default;
    }
  },

  process: function (who) {
    for (var key in this.config.JAVASCRIPT) {
      _files.[who][key] = this.config.[who][key].map(function (PATH) {
        return fs.readFileSync(PATH, 'UTF-8');
      }).join('\n');

      try {
        _files.[[who, 'OLD'].join('_')][key] = fs.readFileSync(_build.getFileName(key, false, who), 'UTF-8');
      } catch (e) {}
      try {
         _files.[[who, 'MIN', 'OLD'].join('_')][key] = fs.readFileSync(_build.getFileName(key, true, who), 'UTF-8');
      } catch (e) {}

    }
  }

};



/**
  * _RUN OBJ IS _RUN YOU.
  */

var _run = {

  init: function (what) {
    if (!_config.config) {
      _write.noConfig();
      return module.exports;
    }
    this.jshint();
    return module.exports;
  },

  jshint: function () {
    _write.newLine();
    var files = _files.JAVASCRIPT, file;
    for (file in files) {
      var errors = [];
      jshint(files[file], _config.config.JSHINT_OPTS);
      jshint.errors.forEach(function (err) {
        if (err && err.reason != 'Expected an assignment or function call and instead saw an expression.') {
          errors.push(err);
        }
      });
      _write.jshint(key, errors);
    }
  }

};



/**
  * _BUILD OBJ IS _BUILD YOU.
  */

var _build = {

  lastBuilt: null,

  createDir: function (who) {
    var that = this;
    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      try {
        fs.statSync(_config.DIST_DIR[who]);
      } catch (e) {
        fs.mkdirSync(_config.DIST_DIR[who], 0775);
      }
    });
  },

  init: function (what, who) {

    if (!_config.config) {
      _write.noConfig();
      return module.exports;
    }

    this.createDir(who);

    _write.newLine();

    switch (what && what.toLowerCase()) {
      case 'full':
      case 'uncompressed':
        this.lastBuilt = this.uncompressed(who);
        break;
      case 'compressed':
      case 'uglifyjs':
      case 'min':
        this.lastBuilt = this.compressed(who);
        break;
      default:
        this.uncompressed(who);
        this.lastBuilt = this.compressed(who);
    }

    _write.message('\n');

    return module.exports;
  },

  uncompressed: function (who) {
    var that = this;
    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      for (file in _files[who]) {
        fs.writeFileSync(that.getFileName(file, false, who), _files[who][file]);
        _write.built('an uncompressed file', file);
      }
    });
  },

  compressed: function (who) {
    var that = this;
    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      for (file in _files[who]) {
        if (who == 'JAVASCRIPT') {
          that.uglify(file, _files[who][file]);
        } else {
          //we ignore CSS at this time ... Possibly uglifyCSS in the future??
        }
      }
    });
  },

  uglify: function (file, file_contents) {]
    var tok = uglifyJs.parser.tokenizer(file_contents)
      , c = tok();

    _files.JAVASCRIPT_MIN[fileName] = this.showCopyright(c.comments_before) || '';

    var ast = uglifyJs.parser.parse(file_contents);
    ast = uglifyJs.uglify.ast_mangle(ast);
    ast = uglifyJs.uglify.ast_squeeze(ast);

    _files.JAVASCRIPT_MIN[file] += uglifyJs.uglify.gen_code(ast);

    fs.writeFileSync(this.getFileName(file, true, 'JAVASCRIPT'), _files.JAVASCRIPT_MIN[file]);
    _write.built('a minified file with uglifyJs', file);
  },

  getFileName: function (name, min, who) {
    return _config.DIST_DIR[who]
      + '/'
      + name
      + (_config.config.VERSION ? '-' + _config.config.VERSION : '')
      + (min ? '.min' : '')
      + who == 'JAVASCRIPT' ? '.js' : '.css';
  },

  showCopyright: function (comments) {
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
  }

};



/**
  * _ANALYZE OBJ IS ANALYZE YOU.
  */

var _analyze = {

  init: function (what, who) {
    if (!_config.config) {
      _write.noConfig();
      return module.exports;
    }

    _write.newLine();
    _write.message('Analyzing File Sizes...\n'.yellow)

    switch (what && what.toLowerCase()) {
      case 'full':
      case 'uncompressed':
        this.process('uncompressed', who);
        break;
      case 'compressed':
      case 'uglifyjs':
      case 'min':
        this.process('compressed', who);
        break;
      case 'gzip':
      case 'gzipped':
        this.gzipped(who);
        break;
      default:
        this.process('uncompressed', who);
        this.process('compressed', who);
        this.process('gzipped', who);
    }

    return module.exports;
  },

  process: function (what, who) {
    var that = this;
    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      who += what != 'uncompressed' ? '_min' : '';
      var oldFile = [who, 'OLD'].join('_');
      if (what == 'gzipped') {
        this.gzipped(_files[who], _files[who][oldFile]);
      } else {
        for (file in _files[who]) {
          if (!_files[oldFile]) {
            return _write.noOldFiles(what, file);
          } else {
            _write.analysis(what, file, _files[who][oldFile].length, _files[who][file].length)
          }
        }
      }
    });
  },

  gzipped: function (files, oldFiles){
    for (var file in files) {
      (function (file) {
        if (!oldFiles[file]) {
          return _write.noOldFiles('gzipped', file);
        }
        gzip(oldFiles[file], function (err, data) {
          var oldGzipLen = data.length;
          gzip(files[file], function (err, data) {
            var newGzipLen = data.length;
            _write.analysis('gzipped', file, oldGzipLen, newGzipLen)
          });
        })
      }(file));
    }
  }

};



/**
  * _GET OBJ IS _GET YOU.
  */
var _get = {

  getFilePaths: function (who) {
    var that = this
      , result = {}
      , file;

    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      result[who] = result[who] || {
        uncompressed: {},
        compressed: {}
        virgin: {}
      };

      for (file in _files[who]) {
        result[who].uncompressed[file] = _build.getFileName(file, false, who);
      }
      for (file in _files[who]) {
        result[who].compressed[file] =_build.getFileName(file, false, who);
      }
      for (file in config[who]) {
        result[who][file] = config[who][file];
      }
    });

    return result;
  },

  init: function (what) {

    if (!_config.config) {
      _write.noConfig();
      return false;
    }

    what = what == 'all' ? false : what && what.toUpperCase();
    return this.getFilePaths([what]);
  }

}


/**
  * _API OBJ IS _API YOU. (COME AT ME!)
  */

var _API = {

  make: function () {
    this.config.apply(this, arguments);
    this.clean();
    this.run();
    this.build();
    this.anaylze();
    return this;
  },

  clean: function (who) {
    var that = this;
    who = who ? [who] || ['JAVASCRIPT', 'CSS'];

    who.forEach(function (who) {
      try {
        rimraf.sync(_config.DIST_DIR[who])
      } catch (e) {} //don't freak out if no DIST_DIR yet...
    });
    return this;
  },

  config: _config.init,

  run: _run.init,

  build: _build.init,

  analyze: _analyze.init,

  get: _get.init

};



/**
  * _INTERFACE OBJ IS INTERFACE YOU.
  */

var _interface = {

  terminal: function (args) {
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
          _API.clean();
          break;
        case 'c':
        case 'compressed':
        case 'compress':
        case 'min':
          _API.config(args[1]);
          _API.build('compressed');
          break;
        case 'f':
        case 'uncompressed':
        case 'uncompress':
        case 'full':
          _API.config(args[1]);
          _API.build('uncompressed');
          break;
        case 'b':
        case 'build':
          _API.config(args[1]);
          _API.build();
          break;
        case 'r':
        case 'run':
          _API.config(args[1]);
          _API.run();
          break;
        case 'm':
        case 'make':
          _API.make(args[1]);
          break;
        case 'a':
          try { _API.anaylze(); } catch (e) {
            _write.message('Something went wrong analyzing your file... are you sure you built something new first?'.red);
          }
          break;
        default:
          _API.make(args[0]);
      }
    });
  }
};



/**
  * WRITE EXPOSE THIS JUNK
  */

for (var key in _API) {
  module.exports[key] = _API[key];
}

module.exports.terminal = terminal;