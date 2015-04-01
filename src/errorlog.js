'use strict';

function format() {
  var arg = arguments;
  var msg = '';
  var ptr = 0;

  // Process the format string and parameters
  if (typeof(arg[0]) === 'string') {
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
  if (typeof(stream.write) === 'function') {
    return function log(message) {
      stream.write(new Date().toISOString() + ' - ' + message + '\n');
    }
  } else if (typeof(stream) === 'function') {
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

// Our default log function, shared where not overridden
var defaultLog = wrap(process.stderr);
var defaultLevel = INFO;

// Simple log emitter
function simplelog(options) {
  options = options || {};

  var category = null;
  var log = defaultLog;
  var level = defaultLevel;

  // Looks like a stream, just bind it
  if (typeof(options.write) === 'function') {
    log = wrap(options);
  }

  // Simple function, use for logging
  else if (typeof(options) === 'function') {
    log = options;
  }

  // String only, must be a category name
  else if (typeof(options) === 'string') {
    category = options || null;
  }

  // Object: may contain "logger" and "category"
  else if (typeof(options) === 'object') {
    if (options.category) category = String(options.category) || null;
    if (options.level) level = Number(options.level) || defaultLevel;
    if (options.logger) log = wrap(options.logger);
  }

  // Anything else is a big no-no
  else throw new Error('Must be called with a string, function, Writable or options');

  // Our emitter function with or without categories
  var emit = category ?
    function emit() { log(category + ' - ' + format.apply(null, arguments)) } :
    function emit() { log(format.apply(null, arguments)) } ;

  // Return our logging function
  var logger   = function log()   { if (level <= ERROR) emit.apply(null, arguments) }
  logger.debug = function debug() { if (level <= DEBUG) emit.apply(null, arguments) }
  logger.info  = function info()  { if (level <= INFO)  emit.apply(null, arguments) }
  logger.warn  = function warn()  { if (level <= WARN)  emit.apply(null, arguments) }
  logger.error = function error() { if (level <= ERROR) emit.apply(null, arguments) }
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
