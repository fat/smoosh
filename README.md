SMOOOOSH.
=========
How would you smoosh a lion and a tiger? A tialiganer, right?  

SMOOSH is a tool for packaging your javascript projects... it will run jshint against your files, then build and minify your files if you'd like.  

to install smoosh do something like this:  

    npm install smoosh

USING SMOOSH
============

once installed, smoosh is pretty easy to use...

    var smoosh = require('smoosh');

Once required there are several methods available to you:

CONFIG
------

config requires that you pass it the path to your configuration json file. You cannot use smoosh without a config file.

    smoosh.config('./config.json')

your config file should look something like this (check the examples folder for a working example):

	{ 
	  "VERSION": "0.1",
	  "SOURCES": { 
	    "base": [ ... ],
	    "secondary": [ ... ]
	  },
	  "DIST_DIR": "dist",
	  "JSHINT_OPTS": { ... }
	}

Your config options include:

  + VERSION: an optional version number which will be appended to your built files
  + SOURCES:
	+ key: the name of your compiled file (ie: 'mootools-core', 'base-bundle', etc.)
	+ value: an array of file paths to be bundled (ie. ['./src/drag.js', './src/drop.js'])
  + DIST_DIR: the directory to output your files to (if no directory is specified, 'dist' will be used)
  + JSHINT_OPTS: the options to use if running jshint

CLEAN
-----
The clean method will remove your distribution directory

RUN
---
Run takes one argument; a string which specifies what to run. Currently run only works with jslint, therefore you can do either:

    smoosh.run('jslint');

	//or
	
	smoosh.run();

In the future we may add more useful things here.

BUILD
-----
Build is used to build your sources together. You can build uncompressed or compressed files or both! You can use it like this:

	smoosh.build('uncompressed');
	
	//or
	
	smoosh.build('compressed');
	
	//or
	
	smoosh.build() // <-- this will build both compressed and uncompressed


ANALYZE
-------
Analyzed is useful when you're curious if you're making your files larger or smaller. It will return relevant file size for uncompressed, compressed, or gzipped files.

    smoosh.analyze('uncompressed');

	//or
	
    smoosh.analyze('compressed');

	//or
	
    smoosh.analyze('gzipped'); //it gzips the compressed files only

	//or 
	
	smoosh.analyze(); //which will do analyze all types

MAKE
----
Make can currently be used as a shortcut to run all smoosh methods... It requires one argument, the path to the config file.json.

	smoosh.make('./config.json');
	
	//is the same as
	
	smoosh.config('./config.json').clean().run().build().analyze();
	
CHAINING
--------
Note: that smoosh supports chaining, if you're into that sorta thing.