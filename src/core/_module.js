'use strict';

goog.require('angular');
goog.require('angular.module');

goog.provide('angular.coreModule');

angular.coreModule = angular.module('core', []).
    value({
      '$filter': noop,
      '$sniffer': {}
    }).
    factory('$rootElement', ['$window', function(window) {
      return [window.document.body.parentNode];
    }]).
    factory('$directiveInjector', ['$injector', function($injector) {
      return $injector.limit('directive:');
    }], true);


//TODO(misko): clean up
angular.module('ng');
