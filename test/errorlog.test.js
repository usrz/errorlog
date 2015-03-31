'use strict';

var expect = require('chai').expect;
var simplelog = require('../src/errorlog.js');

// A regular expression matching an ISO date
var expr = /^[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}:[\d]{2}\.[\d]{3}Z - (.*)/;

// Bleaurgh, a fake stream for test
function Stream() {
  var data = '';
  this.write = function write(string) {
    data += string;
  }
  this.check = function check() {
    var s = data;
    data = '';
    // Expect to match iso date
    expect(s).to.match(expr);
    return s.substr(27, s.length - 28);
  }
}

// Inject the default stream
var stream = simplelog.defaultLog = new Stream();

// The shared log for testing
var log = simplelog();

describe('Simple log test', function() {

  it('should log a simple message', function() {
    log('a simple message to log');
    expect(stream.check()).to.equal('a simple message to log');
  });

  it('should log a formatted message', function() {
    log('number %d string %s json %j percent % and %% borked %x nan %d end', 123.456, 'foobar', { hello: 'world' }, 'foo' );
    expect(stream.check()).to.equal('number 123.456 string foobar json {"hello":"world"} percent % and % borked %x nan NaN end');
  });

  it('should log a formatted message with insufficient arguments', function() {
    log('%d %d %d %d', 1, 2, 3);
    expect(stream.check()).to.equal('1 2 3 %d');
  });

  it('should log a formatted message with extra arguments', function() {
    log('%d %d %d %d', 1, 2, 3, 4, 5, 'hello', { foo: 'bar' });
    expect(stream.check()).to.equal('1 2 3 4\n  >>> 5\n  >>> "hello"\n  >>> {"foo":"bar"}');
  });

  it('should log a formatted message with an error', function() {
    log('test message', new Error('error title'));
    expect(stream.check()).to.match(/^test message\n  Error: error title\n    at/m);
  });

  it('should log a formatted message with extra arguments and an error', function() {
    log('test %s message', 'nice', { foo: 'bar' }, new Error('error title'));
    expect(stream.check()).to.match(/^test nice message\n  >>> {"foo":"bar"}\n  Error: error title\n    at/m);
  });

  it('should use a category', function() {
    simplelog('my own category')('A categorized message');
    expect(stream.check()).to.equal('my own category - A categorized message');
  });

  it('should use a stream', function() {
    var logger = new Stream();

    log('this should go to the shared logger');
    simplelog(logger)('different logger');

    expect(stream.check()).to.equal('this should go to the shared logger');
    expect(logger.check()).to.equal('different logger');
  })

  it('should use a stream and a category', function() {
    var logger = new Stream();

    log('this should go to the shared logger');
    simplelog({logger: logger, category: 'foobar'})('different logger');

    expect(stream.check()).to.equal('this should go to the shared logger');
    expect(logger.check()).to.equal('foobar - different logger');
  })

  it('should use a function', function() {
    var data;
    var logger = function(string) { data = string };

    log('this should go to the shared logger');
    simplelog({logger: logger})('different logger');

    expect(stream.check()).to.equal('this should go to the shared logger');
    expect(data).to.equal('different logger');
  })

  it('should use a function and a category', function() {
    var data;
    var logger = function(string) { data = string };

    log('this should go to the shared logger');
    simplelog({logger: logger, category: 'foobar'})('different logger');

    expect(stream.check()).to.equal('this should go to the shared logger');
    expect(data).to.equal('foobar - different logger');
  })

});

