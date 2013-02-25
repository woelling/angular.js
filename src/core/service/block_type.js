'use strict';

goog.provide('angular.core.BlockType');
goog.provide('angular.core.BlockType.factory');
goog.provide('angular.core.BlockTypeFactory');

goog.require('angular.core.BlockCache');
goog.require('angular.core.dom.clone');

/**
 * @typedef {function(
 *      new:angular.core.Block,
 *      (angular.core.NodeList|string)=,
 *      Array.<angular.core.BlockCache>=
 *  ):angular.core.Block}
 */
angular.core.BlockType = TYPE('angular.core.BlockType', function(fn) {
  return typeof fn == 'function';
});

/**
 * @typedef {function(
 *      angular.core.NodeList,
 *      Array.<angular.core.DirectiveDef>,
 *      string=
 *   ):angular.core.BlockType}
 */
angular.core.BlockTypeFactory;


/**
 * @param {angular.Injector} $injector
 * @param {angular.core.ExceptionHandler} $exceptionHandler
 * @param {angular.core.BlockFactory} $blockFactory
 * @param {angular.core.NodeList} templateNodeList
 * @param {angular.core.DirectivePositions} directivePositions
 * @param {string=} group
 * @return {angular.core.BlockType}
 */
angular.core.BlockType.factory = function ($injector, $exceptionHandler, $blockFactory,
                                          templateNodeList, directivePositions, group) {
  VERIFY(arguments,
    ARG('$injector').is(angular.Injector),
    ARG('$excetionHandler').is(angular.core.ExceptionHandler),
    ARG('$blockFactory').is(angular.core.BlockFactory),
    ARG('templateNodeList').is(String, angular.core.NodeList),
    ARG('directivePositions').is(angular.core.DirectivePositions),
    ARG('group').is(String, undefined));

  if (typeof templateNodeList == 'string') {
    templateNodeList = angular.core.dom.htmlToDOM(/** @type {string} */ (templateNodeList));
  }

  return angular_core_BlockType;

  /**
   * @param {angular.core.NodeList=} instanceNodeList
   * @param {Array.<angular.core.BlockCache>=} blockCaches
   * @return {angular.core.Block}
   * @constructor
   */
  function angular_core_BlockType(instanceNodeList, blockCaches) {
    VERIFY(arguments,
      ARG('instanceNodeList').is(angular.core.NodeList, undefined),
      ARG('blockCaches').is(Array.of(angular.core.BlockCache), undefined));

    return $blockFactory(
        instanceNodeList || angular.core.dom.clone(templateNodeList),
        directivePositions, blockCaches, group);
  }

};
angular.annotate.$inject(
    ['$injector', '$exceptionHandler', '$blockFactory'],
    angular.core.BlockType.factory,
    true);


