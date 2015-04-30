'use strict';

var util = require('util');

function format() {
  var arg = arguments;
  var msg = '';
  var ptr = 0;

  // Process the format string and parameters
  if (util.isString(arg[0])) {
    var len = arg.length - 1;
    msg += arg[0].replace(/%[sdj%]/g, function(val) {
      if (ptr >= len) return val;
      switch(val) {
        case '%%': return '%';
        case '%s': return String(arg[++ ptr]);
        case '%d': return Number(arg[++ ptr]);
        case '%j': try {
          return JSON.stringify(arg[++ ptr]);
        } catch (error) {
          return '(circular structure)';
        }
        default: return val;
      }
    })
  }

  // Process anything that was not in the format
  for (++ ptr; ptr < arg.length; ptr ++) {
    if (arg[ptr]) try {
      var json = JSON.stringify(arg[ptr]);
      if ((json !== '{}') || (!(arg[ptr] instanceof Error))) {
        msg += '\n  >>> ' + json;
      }
    } catch (error) {
      msg += '\n  >>> (circular structure)';
    }

    // Dump stack traces for every exception
    if (arg[ptr] instanceof Error) {
      msg += '\n  ' + arg[ptr].stack;
    }
  }

  // Return the message
  return msg;
}

function wrap(stream) {
  if (util.isFunction(stream.write)) {
    return function log(message) {
      stream.write(new Date().toISOString() + ' - ' + message + '\n');
    }
  } else if (util.isFunction(stream)) {
    return stream;
  } else {
    throw new Error('The "logger" must be a function or Writable stream');
  }
};

// Logging levels
var ALL   =  -1;
var DEBUG = 100;
var INFO  = 200;
var WARN  = 300;
var ERROR = 400;
var OFF   = Number.MAX_SAFE_INTEGER;
var LOG   = OFF - 1; // internal only

// Our default log function, shared where not overridden
var defaultLog = wrap(process.stderr);
var defaultLevel = INFO;

// Simple log emitter
function simplelog(options) {
  options = options || {};

  var category = null;
  var level = null;
  var log = null;

  // Looks like a stream, just bind it
  if (util.isFunction(options.write)) {
    log = wrap(options);
  }

  // Simple function, use for logging
  else if (util.isFunction(options)) {
    log = options;
  }

  // String only, must be a category name
  else if (util.isString(options)) {
    category = options || null;
  }

  // Object: may contain "logger" and "category"
  else if (util.isObject(options)) {
    if (options.category) category = String(options.category) || null;
    if (options.level) level = Number(options.level) || null;
    if (options.logger) log = wrap(options.logger);
  }

  // Anything else is a big no-no
  else throw new Error('Must be called with a string, function, Writable or options');

  // Our emitter function with or without categories
  function emit(logLevel, args) {
    if (logLevel < (level || defaultLevel)) return;

    var data = [ format.apply(null, args) ];

    if (category) {
      data.unshift(': ');
      data.unshift(category);
    }

    var levelString;
    if      (logLevel <= DEBUG) levelString = 'DEBUG - ';
    else if (logLevel <= INFO)  levelString = ' INFO - ';
    else if (logLevel <= WARN)  levelString = ' WARN - ';
    else if (logLevel <= ERROR) levelString = 'ERROR - ';
    else                        levelString = '  LOG - ';

    data.unshift(levelString);

    (log || defaultLog)(data.join(''));
  }

  // Return our logging function
  var logger   = function log()   { emit(LOG,   arguments) }
  logger.debug = function debug() { emit(DEBUG, arguments) }
  logger.info  = function info()  { emit(INFO,  arguments) }
  logger.warn  = function warn()  { emit(WARN,  arguments) }
  logger.error = function error() { emit(ERROR, arguments) }
  return logger;

}

// Prepare our exports
exports = module.exports = simplelog;
exports.format = format;
Object.defineProperties(exports, {
  // Levels
  'ALL':   { configurable: false, enumerable: true, writable: false, value: ALL   },
  'DEBUG': { configurable: false, enumerable: true, writable: false, value: DEBUG },
  'INFO':  { configurable: false, enumerable: true, writable: false, value: INFO  },
  'WARN':  { configurable: false, enumerable: true, writable: false, value: WARN  },
  'ERROR': { configurable: false, enumerable: true, writable: false, value: ERROR },
  'OFF':   { configurable: false, enumerable: true, writable: false, value: OFF   },
  // Defaults
  'defaultLog': {
    configurable: false,
    enumerable: true,
    get: function() { return defaultLog },
    set: function(log) { defaultLog = wrap(log) }
  },
  'defaultLevel': {
    configurable: false,
    enumerable: true,
    get: function() { return defaultLevel },
    set: function(level) { defaultLevel = Number(level) || ERROR }
  },

});
