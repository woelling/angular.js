goog.provide('angular_export');

goog.require('angular');
goog.require('angular.annotate');
goog.require('angular.core.$Anchor');
goog.require('angular.core.$Block');
goog.require('angular.core.$compile');
goog.require('angular.core.$template');
goog.require('angular.core.$window');
goog.require('angular.core.$exceptionHandler');
goog.require('angular.core.$log');
goog.require('angular.core.$rootScope');

window['angular'] = {
  'lowercase': lowercase,
  'uppercase': uppercase,
  'forEach': forEach,
  'injector': createInjector,
  'extend': extend,
  'module': angular.module,
  'bind': bind
};

goog.exportProperty(angular.Module.prototype, 'run', angular.Module.prototype.run);
