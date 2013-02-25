'use strict';

/**
 * @param {...*} var_args
 */
var LOG = function(var_args) {
  if (COMPILED) return;
  var args = [];

  for (var i = 0, ii = arguments.length; i < ii; i++) {
    args.push(STRINGIFY(arguments[i], 3));
  }
  if (LOG.suppressPassed) {
    if (!LOG.queue) { LOG.queue = []; }
    LOG.queue.push(args);
  } else {
    window.console.log.apply(window.console, args);
  }
};

LOG.suppressPassed = true;

if (LOG.suppressPassed && !window.COMPILED) {
  window['afterEach'](function() {

    var env = (window['jasmine']['getEnv']());
    var results = env['currentSpec']['results']();

    if (results['failedCount']) {
      for (var i = 0, ii = LOG.queue.length; i < ii; i++) {
        var args = LOG.queue[i];
        window.console.log.apply(window.console, args);
      }
    }
    LOG.queue = [];
  });
}

/**
 * @param {*} obj
 * @param {number=} depth
 * @return {string}
 */
var STRINGIFY = function(obj, depth) {
  if (COMPILED) return '';
  if (typeof depth != 'number') depth = 3;
  if (depth == 0) return '...';

  if (obj === null) return 'null';

  switch (typeof obj) {
    case 'undefined':
      return 'undefined';
    case 'string':
      return '"' + obj + '"';
    case 'function':
      return obj.toString().replace(/\{[\s\S]*\}/, '{ ... }');
    case 'object':
      var strs = [];
      var Constructor = obj.constructor;
      if (typeof Constructor.STRINGIFY == 'function') {
        return Constructor.STRINGIFY(obj);
      } else if (obj instanceof Array) {
        strs.push('[');
        for (var i = 0, ii = obj.length; i < ii; i++) {
          if (i) strs.push(', ');
          strs.push(STRINGIFY(obj[i], depth - 1));
        }
        strs.push(']');
      } else if (obj instanceof Date) {
        return obj.toString();
      } else if (obj instanceof Text) {
        return obj.nodeValue;
      } else if (obj instanceof Comment) {
        return '<!--' + obj.nodeValue + '-->';
      } else if (obj instanceof Node) {
        return obj.outerHTML;
      } else {
        strs.push(obj.constructor.name);
        strs.push('{');
        var first = true;
        for(var key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (first) { first = false; } else { strs.push(', '); }
            strs.push(key + ': ' + STRINGIFY(obj[key], depth - 1));
          }
        }
        strs.push('}');
      }
      return strs.join('');
    default:
      return '' + obj;
  };
}

/**
 * @param {string} name
 * @param {Arguments} args
 * @return {function(...[*])}
 * @constructor
 */
var FN_TRACE = function(name, args) {
  var trace = [];
  if (!LOG.queue) { LOG.queue = []; }
  LOG.queue.push(trace);
  write(1, name + '(', arguments, ')');

  return function() {
    write(0, '   ', arguments, '');
  };

  function write(start, pre, args, post) {
    var fn = [pre];

    for (var i = start, ii = args.length; i < ii; i++) {
      var arg = args[i];

      if (i !== start) fn.push(', ');
      fn.push(STRINGIFY(arg));
    }
    fn.push(post);
    trace.push(fn.join(''));
  }
}

var S = STRINGIFY;
