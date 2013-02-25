'use strict';

angular.module('core.test', ['core']).config(function($provide) {
  $provide.value('$rootElement', $('<div ng-app></div>'));
});
