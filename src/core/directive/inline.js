'use strict';


goog.require('angular.coreModule');

goog.provide('angular.core.directive.splitAttrDirective');

angular.coreModule.directive(':contains(/{{.*}}/)', [
  '$service_$interpolate', '$value', '$text',
  function($interpolate, $value, $text) {
    $text('');

    this.attach = function(scope) {
      scope.$watch($interpolate($value), $text);
    };
  }]);

angular.coreModule.directive('[*=/{{.*}}/]', [
  '$service_$interpolate', '$value', '$attr',
  function($interpolate, $nameValue, $attr) {
    var nameValue = angular.core.directive.splitAttrDirective($nameValue),
        attribute = $attr(nameValue[0]),
        value = nameValue[1];

    attribute('');

    this.attach = function(scope) {
      scope.$watch($interpolate(value), attribute);
    };
  }]);

angular.core.directive.splitAttrDirective = function(nameValue) {
  var match = angular.core.directive.splitAttrDirective.REGEXP.exec(nameValue);

  return [match[1], match[2]];
};

angular.core.directive.splitAttrDirective.REGEXP = /^([^=]*)=(.*)$/;
