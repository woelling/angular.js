'use strict';

goog.provide('angular.core.BlockList');
goog.provide('angular.core.BlockListFactory');

goog.require('angular.annotate');
goog.require('angular.core.Block');
goog.require('angular.core.ElementWrapper');
goog.require('angular.core.Scope');


/**
 * @typedef {function(
 *    Array.<angular.core.NodeList>,
 *    Object.<angular.core.BlockType>,
 *    angular.core.BlockCache=
 *  ):angular.core.BlockList}
 */
angular.core.BlockListFactory = TYPE('angular.core.BlockListFactory', function(value) {
  return typeof value == 'function';
});


/**
 * An Anchor is an instance of a hole. Anchors designate where child Blocks can be added in parent Block. Anchors
 * wrap a DOM element, and act as references which allows more blocks to be added.
 *
 * @param {angular.core.Scope} $rootScope
 * @param {angular.core.NodeList} elements An array of elements which the Anchor wraps. (Even thought Anchor takes an
 *   array of elements, Anchors always wrap exactly one element.)
 * @param {Object.<angular.core.BlockType>} blockTypes
 * @param {angular.core.BlockCache=} blockCache
 * @constructor
 * @implements {angular.core.ElementWrapper};
 */
angular.core.BlockList = function ($rootScope, elements, blockTypes, blockCache) {
  VERIFY(arguments,
    ARG('$rootScope').is(angular.core.Scope),
    ARG('elements').is(angular.core.NodeList),
    ARG('blockTypes').is(OBJECT(angular.core.BlockType)),
    ARG('blockCache').is(angular.core.BlockCache, undefined));


  if (!blockCache) blockCache = new angular.core.BlockCache();

  /** @type {angular.core.NodeList} */
  this.elements = elements;
  /** @type {angular.core.ElementWrapper} */
  this.next = this.previous = null;
  /** @type {angular.core.BlockCache} */
  this.blockCache = blockCache;
  /** @type {Object.<angular.core.BlockType>} */
  this.blockTypes = blockTypes;

  // This is a bit of a hack.
  // We need to run after the first watch, that means we have to wait for watch, and then schedule $evalAsync.
  var deregisterWatch = $rootScope.$watch(function() {
    deregisterWatch();
    $rootScope.$evalAsync(function() {
      blockCache.flush(function(block) {
        block.remove();
      });
    });
  });
};
angular.annotate.$inject(['$rootScope'], angular.core.BlockList, true);

/**
 * @param {string=} type
 * @return {angular.core.Block}
 */
angular.core.BlockList.prototype.newBlock = function(type) {
  type = type || '';

  /** @type {angular.core.Block} */
  var block = this.blockCache.get(type);

  if (!block) {
    if (!this.blockTypes.hasOwnProperty(type)) {
      LOG('blockTypes', STRINGIFY(this.blockTypes));
      throw new Error("Unknown block type: '" + type + "'.");
    }

    block = this.blockTypes[type]();
  }

  return block;
};

