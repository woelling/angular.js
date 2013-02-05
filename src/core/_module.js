'use strict';

goog.provide('angular.core.module');

goog.provide('angular.core.$Anchor');
goog.provide('angular.core.$Block');

goog.require('angular');
goog.require('angular.module');

goog.require('angular.core.Anchor');
goog.require('angular.core.Block');
goog.require('angular.core.Template');
goog.require('angular.core.$timeout');
goog.require('angular.core.$rootScope');
goog.require('angular.core.$compile');

goog.require('angular.core.directive.Bind');
goog.require('angular.core.directive.Repeat');
goog.require('angular.core.directive.TextInterpolation');
goog.require('angular.core.directive.AttrInterpolation');



angular.core.module = angular.module('core', []).
    value({
      '$filter': noop,
      '$sniffer': {},
    }).
    factory('$directiveInjector', ['$injector', function($injector) {
      return $injector.limit('directive:');
    }]).
    factory('$compile', angular.core.$compileFactory, true).
    factory({
      '$rootElement': ['$window', function(window) {
        return [window.document.body.parentNode];
      }],
      '$template': angular.core.$templateFactory,
      '$timeout': angular.core.$timeoutFactory
    }).
    provider('$rootScope', $RootScopeProvider).
    provider('$parse', $ParseProvider).
    provider('$interpolate', $InterpolateProvider).
    curry('$Anchor', angular.core.Anchor).
    curry('$Block', angular.core.Block).
    directive('[bind]', angular.core.directive.Bind).
    directive('[repeat]', angular.core.directive.Repeat).
    directive('[click]', angular.core.directive.Click).
    directive('[mouseover]', angular.core.directive.OnMouseOver).
    directive(angular.core.directive.TextInterpolation.$selector, angular.core.directive.TextInterpolation).
    directive(angular.core.directive.AttrInterpolation.$selector, angular.core.directive.AttrInterpolation);


/**
 * Bound anchor constructor.
 * @typedef {function(new:angular.core.Anchor, Array.<Node>, Array.<angular.core.Template>)}
 */
angular.core.$Anchor;

