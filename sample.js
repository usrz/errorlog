'use strict';

var errorlog = require('./src/errorlog.js');
errorlog.defaultLevel = errorlog.ALL;

console.log('\n... Without any category...\n');

var log1 = errorlog();

log1('I have %d %s, and an object %j', 3, 'apples', { foo: 'bar' });
log1.debug('A debug message');
log1.info('Informational message');
log1.warn('Some sort of warning');
log1.error('Something is wrong...');

console.log('\n... When a category is specified...\n');

var log2 = errorlog('my category');

log2('I have %d %s and an error', 2, 'mangoes', new Error('Hello, world!'));
log2.debug('A debug message with some extra', {foo: "bar", baz: 12345});
log2.info('Informational message');
log2.warn('Some sort of warning');
log2.error('Something is wrong...');

console.log('\n... Boring output with defaultColorize = false...\n');

errorlog.defaultColorize = false;

log2('I have %d %s and an error', 2, 'mangoes', new Error('Hello, world!'));
log2.debug('A debug message with some extra', {foo: "bar", baz: 12345});
log2.info('Informational message');
log2.warn('Some sort of warning');
log2.error('Something is wrong...');

console.log('\n... There you go, all done...\n');
