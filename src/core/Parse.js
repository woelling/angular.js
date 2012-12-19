'use strict';

goog.provide('angular.core.Parse');
goog.provide('angular.core.ParsedExpression');
goog.provide('angular.core.Setter');

/**
 * param {string} expression Expression string.
 * returns {angular.core.ParsedExpression}
 *
 * @typedef {function(string):angular.core.ParsedExpression}
 */
angular.core.Parse;

/**
 * An executor for the parsed expression.
 * param {Object} context The object which will be used for dereferencing
 *   properties. Usually an angular.core.Scope, but not required.
 * param {Object=} locals An object representing local properties. If present
 *   the properties are checked here first, creating an illusion of local
 *   variables in expressions.
 *
 * @typedef {(function(Object, Object=):*)};
 */
angular.core.ParsedExpression;

/**
 * param {Object} context The object which will be used for dereferencing
 *   properties. Usually an angular.core.Scope, but not required.
 * param {*} value to assign to expression
 *
 * @typedef {function(Object, *):*};
 */
angular.core.Setter;

