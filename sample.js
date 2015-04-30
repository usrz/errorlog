'use strict';

var errorlog = require('./src/errorlog.js');
errorlog.defaultLevel = errorlog.DEBUG;

var log1 = errorlog();

log1('I have %d %s, and an object %j', 3, 'apples', { foo: 'bar' });
log1.debug('A debug message');
log1.info('Informational message');
log1.warn('Some sort of warning');
log1.error('Like calling log(...)');

var log2 = errorlog('my category');
errorlog.defaultLevel = errorlog.OFF;

log2('I have %d %s and an error', 2, 'mangos', new Error('Hello, world!'));
log2.debug('A debug message with some extra', {foo: "bar", baz: 12345});
log2.info('Informational message');
log2.warn('Some sort of warning');
log2.error('Like calling log(...)');
