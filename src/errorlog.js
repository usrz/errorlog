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

// Logging levels
var ALL   =  -1;
var TRACE =   0;
var DEBUG = 100;
var INFO  = 200;
var WARN  = 300;
var ERROR = 400;
var FATAL = 500;
var OFF   = Number.MAX_SAFE_INTEGER;
var LOG   = OFF - 1; // internal only

// Our default log function, shared where not overridden
var defaultLog = wrap(process.stderr);
var defaultLevel = INFO;
var defaultColorize = true;

function wrap(stream) {
  if (util.isFunction(stream.write)) {
    var colorize = ((stream == process.stderr) || (stream == process.stdout));
    var log = function log(message) {
      if (colorize && defaultColorize) {
        stream.write('\x1B[38;5;240m' + new Date().toISOString() + '\x1B[0m - ' + message + '\n');
      } else {
        stream.write(new Date().toISOString() + ' - ' + message + '\n');
      }
    }
    log.colorize = true;
    return log;

  } else if (util.isFunction(stream)) {
    return stream;
  } else {
    throw new Error('The "logger" must be a function or Writable stream');
  }
};

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

    var currentLog = log || defaultLog;
    var colorize = (currentLog.colorize || false) && defaultColorize;

    var data = [ format.apply(null, args) ];

    if (category) {
      data.unshift(': ');
      if (colorize) data.unshift('\x1B[0m');
      data.unshift(category);
      if (colorize) {
      if      (logLevel <= TRACE) data.unshift('\x1B[38;5;23;4m');
      else if (logLevel <= DEBUG) data.unshift('\x1B[38;5;25;4m');
      else if (logLevel <= INFO)  data.unshift('\x1B[38;5;70;4m');
      else if (logLevel <= WARN)  data.unshift('\x1B[38;5;100;4m');
      else if (logLevel <= ERROR) data.unshift('\x1B[38;5;131;4m');
      else if (logLevel <= FATAL) data.unshift('\x1B[38;5;124;4m');
      else                        data.unshift('\x1B[38;5;37;4m');
      }
    }

    data.unshift(' - ');

    if (colorize) data.unshift('\x1B[0m');

    if      (logLevel <= TRACE) data.unshift('TRACE');
    else if (logLevel <= DEBUG) data.unshift('DEBUG');
    else if (logLevel <= INFO)  data.unshift(' INFO');
    else if (logLevel <= WARN)  data.unshift(' WARN');
    else if (logLevel <= ERROR) data.unshift('ERROR');
    else if (logLevel <= FATAL) data.unshift('FATAL');
    else                        data.unshift('  LOG');

    if (colorize === true) {
      if      (logLevel <= TRACE) data.unshift('\x1B[38;5;30m');
      else if (logLevel <= DEBUG) data.unshift('\x1B[38;5;33m');
      else if (logLevel <= INFO)  data.unshift('\x1B[38;5;76m');
      else if (logLevel <= WARN)  data.unshift('\x1B[38;5;142m');
      else if (logLevel <= ERROR) data.unshift('\x1B[38;5;167m');
      else if (logLevel <= FATAL) data.unshift('\x1B[38;5;160m');
      else                        data.unshift('\x1B[38;5;44m');
    }

    currentLog(data.join(''));
  }

  // Return our logging function
  var logger   = function log()   { emit(LOG,   arguments) }
  logger.trace = function trace() { emit(TRACE, arguments) }
  logger.debug = function debug() { emit(DEBUG, arguments) }
  logger.info  = function info()  { emit(INFO,  arguments) }
  logger.warn  = function warn()  { emit(WARN,  arguments) }
  logger.error = function error() { emit(ERROR, arguments) }
  logger.fatal = function fatal() { emit(FATAL, arguments) }
  return logger;

}

// Prepare our exports
exports = module.exports = simplelog;
exports.format = format;
Object.defineProperties(exports, {
  // Levels
  'ALL':   { configurable: false, enumerable: true, writable: false, value: ALL   },
  'TRACE': { configurable: false, enumerable: true, writable: false, value: TRACE },
  'DEBUG': { configurable: false, enumerable: true, writable: false, value: DEBUG },
  'INFO':  { configurable: false, enumerable: true, writable: false, value: INFO  },
  'WARN':  { configurable: false, enumerable: true, writable: false, value: WARN  },
  'ERROR': { configurable: false, enumerable: true, writable: false, value: ERROR },
  'FATAL': { configurable: false, enumerable: true, writable: false, value: FATAL },
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
    set: function(level) { defaultLevel = Number(level) || INFO }
  },
  'defaultColorize': {
    configurable: false,
    enumerable: true,
    get: function() { return defaultColorize },
    set: function(level) { defaultColorize = Boolean(level) }
  },

});
