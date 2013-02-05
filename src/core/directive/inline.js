'use strict';


goog.provide('angular.core.directive.TextInterpolation');
goog.provide('angular.core.directive.AttrInterpolation');

/**
 *
 * @param $service_$interpolate
 * @param $value
 * @param $text
 * @constructor
 */
angular.core.directive.TextInterpolation = function($service_$interpolate, $value, $text) {
  $text('');

  this.attach = function(scope) {
    scope.$watch($service_$interpolate($value), $text);
  };
};

angular.core.directive.TextInterpolation.$selector = ':contains(/{{.*}}/)';
angular.annotate.$inject(['$service_$interpolate', '$value', '$text'], angular.core.directive.TextInterpolation);


/**
 *
 * @param $service_$interpolate
 * @param $value
 * @param $attr
 * @constructor
 */
angular.core.directive.AttrInterpolation = function($service_$interpolate, $value, $attr) {
  var nameValue = angular.core.directive.AttrInterpolation.REGEXP_.exec($value),
      attribute = $attr(nameValue[1]),
      value = nameValue[2];

  attribute('');

  this.attach = function(scope) {
    scope.$watch($service_$interpolate(value), attribute);
  };
};
angular.core.directive.AttrInterpolation.$selector = '[*=/{{.*}}/]';
angular.annotate.$inject(['$service_$interpolate', '$value', '$attr'], angular.core.directive.AttrInterpolation);

/**
 * Attribute directive needs to know two pieces of information. The name of attribute and interpolation expression,
 * but the directive API only sends over one $value string. For this reason the value is encoded as
 * attrName=interpolateValue and this expression is used for splitting it.
 *
 * @type {RegExp}
 * @private
 */
angular.core.directive.AttrInterpolation.REGEXP_ = /^([^=]*)=(.*)$/;
