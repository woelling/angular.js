'use strict';

goog.require('angular');
goog.require('angular.module');

goog.require('angular.core.Anchor');

goog.provide('angular.core.module');

angular.core.module = angular.module('core', []).
    value({
      '$filter': noop,
      '$sniffer': {}
    }).
    factory('$rootElement', ['$window', function(window) {
      return [window.document.body.parentNode];
    }]).
    factory('$directiveInjector', ['$injector', function($injector) {
      return $injector.limit('directive:');
    }], true).
    curry('$Anchor', angular.core.Anchor);


//TODO(misko): clean up
angular.module('ng');

