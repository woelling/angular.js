'use strict';

goog.provide('angular.core.BlockType');
goog.provide('angular.core.BlockType.factory');
goog.provide('angular.core.BlockTypeFactory');

goog.require('angular.core.BlockFactory');
goog.require('angular.core.dom.clone');

/**
 * #param {(angular.core.NodeList|string)} templateSelector
 * #param {Array} directiveDefs
 * #return {angular.core.Block}
 * @typedef {function(new:angular.core.Block, (angular.core.NodeList|string), Array):angular.core.Block}
 */
angular.core.BlockType;

/**
 * @typedef {function(angular.core.NodeList, Array.<angular.core.DirectiveDef>):angular.core.BlockType}
 */
angular.core.BlockTypeFactory;


/**
 * @param {Array.<Node>} $rootElement
 * @param {angular.Injector} $injector
 * @param {angular.core.ExceptionHandler} $exceptionHandler
 * @param {angular.core.BlockFactory} $blockFactory
 * @return {angular.core.BlockType}
 */
angular.core.BlockType.factory = function($rootElement, $injector, $exceptionHandler, $blockFactory,
                                          templateSelector, directiveDefs) {
  if (!directiveDefs) directiveDefs = EMPTY_ARRAY;

  var templateElements = angular.core.dom.extractTemplate($rootElement, templateSelector, directiveDefs);
  ASSERT(templateElements && templateElements.length != undefined);

  return BlockType;

  /**
   * @param {(angular.core.NodeList|string)} blockSelectorHtmlOrElements
   * @param {Array} collectionsBlocks
   * @return {angular.core.Block}
   * @constructor
   */
  function BlockType(blockSelectorHtmlOrElements, collectionsBlocks) {
    /** @type {Array.<string>} */
    var blockElements = blockSelectorHtmlOrElements
        ? (typeof blockSelectorHtmlOrElements == 'string'
        ? angular.core.dom.select($rootElement, blockSelectorHtmlOrElements)
        : blockSelectorHtmlOrElements)
        : angular.core.dom.clone(templateElements);

    return $blockFactory(blockElements, directiveDefs, collectionsBlocks);
  }

};
angular.annotate.$inject(
    ['$rootElement', '$injector', '$exceptionHandler', '$blockFactory'],
    angular.core.BlockType.factory,
    true);


