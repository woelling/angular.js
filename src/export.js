goog.provide('angular_export');

goog.require('angular');
goog.require('angular.annotate');
goog.require('angular.core.module');

window['angular'] = {
  'lowercase': lowercase,
  'uppercase': uppercase,
  'forEach': forEach,
  'injector': createInjector,
  'extend': extend,
  'module': angular.module,
  'bind': bind
};

//goog.exportProperty(angular.Module.prototype, 'run', angular.Module.prototype.run);
