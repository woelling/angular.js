'use strict';

goog.provide('angular.core.Compile');
goog.provide('angular.core.AttrAccessor');

/**
 * @typedef {
 *   function((Array.<Node>|Node|string)):angular.core.Template
 * }
 */
angular.core.Compile;

/**
 * @typedef {
 *   function(string):string
 * }
 */
angular.core.AttrAccessor;
