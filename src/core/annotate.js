'use strict';

goog.provide('angular.annotate');

goog.require('angular.injector');

/**
 * @typedef {{
 *   $inject: (Array.<string>|undefined)
 * }}
 */
angular.annotate.Info;

/**
 * Decorates the function with the $inject property.
 *
 * This function is equivalent to setting the $inject property on the function directly with few exceptions:
 *   - In non-compiled mode it verifies that the $inject names match the function names
 *   - It is required for Closure compiler advanced mode compilation, otherwise the $inject will be treated as a
 *     namespace not a property of the function.
 *
 * @param {Array.<string>} $inject An array of services to inject.
 * @param {Function} fn The function to annotate.
 * @param {boolean=} curry If set to true, then the annotation, is used for currying, which means that the function
 *     can have more arguments then are declared in the $inject annotation.
 */
angular.annotate.$inject = function($inject, fn, curry) {
  var fnInfo = /** @type {angular.annotate.Info} */ (fn);

  if (!COMPILED) {
    var inferedInject = annotate(fn);
    if (curry) {
      inferedInject = inferedInject.slice(0, $inject.length);
    }
    if (!equals(inferedInject, $inject)) {
      var stack = new Error().stack;

      throw Error('Injection arguments do not match. Expected: (' +
          $inject.join(', ') + ') Actual: (' + inferedInject.join(', ') +
          ') at: ' + stack);
    }
  }
  fnInfo.$inject = $inject;
};
