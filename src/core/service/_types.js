'use strict';

goog.provide('angular.core.Accessor');
goog.provide('angular.core.AccessorFactory');
goog.provide('angular.core.AttrAccessor');
goog.provide('angular.core.DirectiveType');
goog.provide('angular.core.NodeList');


/**
 * @interface
 */
angular.core.DirectiveType = function() {};
angular.core.DirectiveType.__ASSERT__ = function(directiveType) {
  return typeof directiveType == 'function';
};

/**
 * @type {number}
 */
angular.core.DirectiveType.prototype.$priority;

/**
 * @type {string}
 */
angular.core.DirectiveType.prototype.$transclude;


/**
 * @type {string}
 */
angular.core.DirectiveType.prototype.$name;

/**
 * This is the actual function name
 * @type {string}
 */
angular.core.DirectiveType.prototype.name;


/**
 * @param {string} value
 * @return {Array.<angular.core.DirectiveDef>}
 */
angular.core.DirectiveType.prototype.$generate = function(value) {};





/**
 * @typedef {function(string):angular.core.Accessor}
 */
angular.core.AccessorFactory;

/**
 * When used with parameter then the accessor acts like setter, when
 * used without argument it is a getter.
 *
 * @typedef {function(*=):*}
 */
angular.core.Accessor;

/**
 * TODO: define
 * @typedef Array
 */
angular.core.ElementDirectivesDecl;

/**
 * @typedef {Array.<Node>|NodeList}
 */
angular.core.NodeList = TYPE('angular.core.NodeList', function(value) {
  return value && typeof value == 'object' && typeof value.length == 'number';
});

/**
 * @typedef {
 *   function(string):string
 * }
 */
angular.core.AttrAccessor;










