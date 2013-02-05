'use strict';

goog.provide('angular.core.directive.Bind');
goog.provide('angular.core.directive.Repeat');

goog.require('angular.core.AttrAccessor');


/**
 * @param {angular.core.AttrAccessor} $text
 * @param {string} $value
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.Bind = function($text, $value) {
  /**
   * @override
   * @param {angular.core.Scope} scope
   */
  this.attach = function(scope) {
    scope.$watch($value, $text);
  };
};
angular.annotate.$inject(['$text', '$value'], angular.core.directive.Bind);

/**
 *
 * @param $on_click
 * @param $value
 * @return {Object}
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.Click = function($on_click, $value) {
  this.attach = function(scope) {
    $on_click(function(event) {
      event.preventDefault();
      scope.$apply($value);
    });
  };
};
angular.annotate.$inject(['$on_click', '$value'], angular.core.directive.Click);

/**
 *
 * @param $on_mouseOver
 * @param $value
 * @return {Object}
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.OnMouseOver = function($on_mouseOver, $value) {
  this.attach = function(scope) {
    $on_mouseOver(function(event) {
      event.preventDefault();
      scope.$apply($value);
    });
  };
};
angular.annotate.$inject(['$on_mouseOver', '$value'], angular.core.directive.OnMouseOver);

/**
 *
 * @param $on_remove
 * @return {Object}
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.FadeOut = function($on_remove) {
  this.attach = function(scope) {
    $on_remove(function(event) {
      var defaultFn = event.preventDefault();

      setTimeout(defaultFn, 500);
      event.element.className += ' fadeout';
    });
  };
};
angular.annotate.$inject(['$on_remove'], angular.core.directive.FadeOut);

/**
 *
 * @param $on_insert
 * @return {Object}
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.FadeIn = function($on_insert) {
  this.attach = function(scope) {
    $on_insert(function(event) {
      var defaultFn = event.preventDefault(),
          originalClass = event.element.className;

      event.element.className = originalClass + ' reverse fadeout';
      defaultFn();
      setTimeout(function() {
        event.element.className = originalClass + ' reverse';
      }, 0)
      setTimeout(function() {
        event.element.className = originalClass;
      }, 500)
    });
  };
};
angular.annotate.$inject(['$on_insert'], angular.core.directive.FadeIn);

/**
 * @param $anchor
 * @param $value
 * @param $service_$parse
 * @constructor
 * @implements {angular.core.Directive}
 */
angular.core.directive.Repeat = function($anchor, $value, $service_$parse) {
  var collectionGetter,
      itemSetter;

  assertArg($value, 'parameter');

  if (isString($value)) {
    $value = $value.split(' in ');
  }

  collectionGetter = $service_$parse($value[1]);
  itemSetter = $service_$parse($value[0]).assign;

  this.attach = function(scope) {
    var previousBlockMap = new HashMap();

    scope.$watch(function() {
      var collection = collectionGetter(scope) || EMPTY_ARRAY,
          currentBlockMap = new HashMap(),
          i, ii = collection.length,
          value, block, previousBlock,
          iterationScope;

      // find which blocks need to be removed
      for(i = 0; i < ii; i++) {
        value = collection[i];
        block = previousBlockMap.remove(value);
        if (block) {
          currentBlockMap.put(value, block);
        }
      }
      // remove blocks
      for(var key in previousBlockMap) {
        if (previousBlockMap.hasOwnProperty(key)) {
          previousBlockMap[key].remove();
        }
      }
      previousBlockMap = currentBlockMap;
      previousBlock = $anchor;

      for(i = 0; i < ii; i++) {
        value = collection[i];
        block = previousBlockMap.get(value);

        if (!block) {
          block = $anchor.newBlock();
          iterationScope = scope.$new();
          itemSetter(iterationScope, value);
          previousBlockMap.put(value, block);
          block.$valueHashKey = hashKey(value);
          iterationScope.$index = i;
          block.attach(iterationScope);
          block.insertAfter(previousBlock);
        } else if (previousBlock.next == block) {
          // do nothing
        } else {
          // move block.
          block.moveAfter(previousBlock);
        }
        previousBlock = block;
      }

    });
  }
};
angular.annotate.$inject(['$anchor', '$value', '$service_$parse'], angular.core.directive.Repeat);
angular.core.directive.Repeat.$transclude = '.';
angular.core.directive.Repeat.$priority = 1000;
