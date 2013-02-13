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
 * @param {angular.core.NodeList|angular.core.Html} elementsOrHtml
 * @param {Array.<angular.core.NodeDirectiveDef>} nodeDirectiveDefs
 * @param {string=} group
 * @return {angular.core.BlockType}
 */
angular.core.BlockType.factory = function ($injector, $exceptionHandler, $blockFactory,
                                          elementsOrHtml, nodeDirectiveDefs, group) {
  VERIFY(arguments,
    ARG('$injector').is(angular.Injector),
    ARG('$excetionHandler').is(angular.core.ExceptionHandler),
    ARG('$blockFactory').is(angular.core.BlockFactory),
    ARG('elementsOrHtml').is(String, angular.core.NodeList),
    ARG('nodeDirectiveDefs').is(ARRAY(angular.core.NodeDirectiveDef)),
    ARG('group').is(String, undefined));

  /** @type {angular.core.NodeList} */
  var elements = isString(elementsOrHtml)
    ? angular.core.dom.htmlToDOM(/** @type {angular.core.Html} */(elementsOrHtml))
    : /** @type {angular.core.NodeList} */ (elementsOrHtml);
  /** @type {angular.core.NodeList} */
  var templateElements =
      angular.core.dom.extractTemplate(elements, nodeDirectiveDefs);

  VAR(templateElements).is(angular.core.NodeList);

  return angular_core_BlockType;

  /**
   * @param {angular.core.NodeList=} instanceElements
   * @param {Array.<angular.core.BlockCache>=} blockCaches
   * @return {angular.core.Block}
   * @constructor
   */
  function angular_core_BlockType(instanceElements, blockCaches) {
    VERIFY(arguments,
      ARG('instanceElements').is(angular.core.NodeList, undefined),
      ARG('blockCaches').is(ARRAY(angular.core.BlockCache), undefined));

    /** @type {angular.core.NodeList} */
    var elements = instanceElements || angular.core.dom.clone(templateElements);

    return $blockFactory(elements, nodeDirectiveDefs, blockCaches, group);
  }

};
angular.annotate.$inject(
    ['$injector', '$exceptionHandler', '$blockFactory'],
    angular.core.BlockType.factory,
    true);


