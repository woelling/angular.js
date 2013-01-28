'use strict';

goog.provide('angular.core.module');

goog.require('angular');
goog.require('angular.module');

goog.require('angular.core.BlockList');
goog.require('angular.core.Block');
goog.require('angular.core.BlockType.factory');
goog.require('angular.core.Compile.factory');
goog.require('angular.core.$timeout');
goog.require('angular.core.$rootScope');
goog.require('angular.core.$interpolate')

goog.require('angular.core.directive.Bind');
goog.require('angular.core.directive.Repeat');
goog.require('angular.core.directive.TextInterpolation');
goog.require('angular.core.directive.AttrInterpolation');



angular.core.module = angular.module('core', []).
    value({
      '$filter': noop,
      '$sniffer': {},
      '$emptyInjector': createInjector()
    }).
    factory('$directiveInjector', ['$injector', function($injector) {
      return $injector.limit('directive:');
    }]).
    factory('$compile', angular.core.Compile.factory, true).
    factory({
      '$rootElement': ['$window', function(window) {
        return [window.document.body.parentNode];
      }],
      '$timeout': angular.core.$timeoutFactory
    }).
    provider('$rootScope', $RootScopeProvider).
    provider('$parse', $ParseProvider).
    provider('$interpolate', $InterpolateProvider).
    curryTypeFactory('$blockListFactory', angular.core.BlockList).
    curryTypeFactory('$blockFactory', angular.core.Block).
    curry('$blockTypeFactory', angular.core.BlockType.factory).
    service('$compiler', angular.core.Compiler).
    directive('[bind]', angular.core.directive.Bind).
    directive('[repeat]', angular.core.directive.Repeat).
    directive('[click]', angular.core.directive.Click).
    directive('[mouseover]', angular.core.directive.OnMouseOver).
    directive(angular.core.directive.TextInterpolation.$selector, angular.core.directive.TextInterpolation).
    directive(angular.core.directive.AttrInterpolation.$selector, angular.core.directive.AttrInterpolation);

/**
 * @param {*} arg
 */
function jqLite(arg) {
  throw Error('No jqLite provided');
}

/**
 * @param {string} name
 * @param {*=} value
 */
jqLite.prototype.prop = function(name, value) {
  throw Error();
}
