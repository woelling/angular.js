'use strict';

goog.require('angular.core.module');

goog.provide('angular.core.$cacheFactory');
goog.provide('angular.core.$templateCache');
goog.provide('angular.core.$CacheFactoryProvider');
goog.provide('angular.core.$TemplateCacheProvider');
goog.provide('angular.core.BlockTypeCache');
goog.provide('angular.core.CacheFactoryOptions');



/**
 * @interface
 */
angular.core.CacheFactoryOptions = function() {};
/**
 * If defined, turns the cache into an LRU cache.
 * @type {number}
 */
angular.core.CacheFactoryOptions.prototype.capacity;



/**
 * @ngdoc object
 * @name ng.$cacheFactory
 *
 * @description
 * Factory that constructs cache objects.
 *
 * @constructor
 */
angular.core.$CacheFactoryProvider = function() {
  this.$get = function() {
    var caches = {};

    /**
     * @param {string} cacheId Name or id of the newly created cache.
     * @param {angular.core.CacheFactoryOptions=} options Options object that specifies the cache behavior.
     *
     * @returns {Object} Newly created cache object with the following set of methods:
     *
     * - `{Object}` `info()` — Returns id, size, and options of cache.
     * - `{void}` `put({string} key, {*} value)` — Puts a new key-value pair into the cache.
     * - `{{*}}` `get({string} key)` — Returns cached value for `key` or undefined for cache miss.
     * - `{void}` `remove({string} key)` — Removes a key-value pair from the cache.
     * - `{void}` `removeAll()` — Removes all cached values.
     * - `{void}` `destroy()` — Removes references to this cache from $cacheFactory
     */
    function cacheFactory(cacheId, options) {
      if (cacheId in caches) {
        throw Error('cacheId ' + cacheId + ' taken');
      }

      var size = 0,
          stats = extend({}, options, {id: cacheId}),
          data = {},
          capacity = (options && options.capacity) || Number.MAX_VALUE,
          lruHash = {},
          freshEnd = null,
          staleEnd = null;

      return caches[cacheId] = {

        /**
         * @this Object
         * @param {string} key
         * @param {*} value
         */
        put: function(key, value) {
          var lruEntry = lruHash[key] || (lruHash[key] = {key: key});

          refresh(lruEntry);

          if (isUndefined(value)) return;
          if (!(key in data)) size++;
          data[key] = value;

          if (size > capacity) {
            this.remove(staleEnd.key);
          }
        },


        get: function(key) {
          var lruEntry = lruHash[key];

          if (!lruEntry) return;

          refresh(lruEntry);

          return data[key];
        },


        remove: function(key) {
          var lruEntry = lruHash[key];

          if (lruEntry == freshEnd) freshEnd = lruEntry.p;
          if (lruEntry == staleEnd) staleEnd = lruEntry.n;
          link(lruEntry.n,lruEntry.p);

          delete lruHash[key];
          delete data[key];
          size--;
        },


        removeAll: function() {
          data = {};
          size = 0;
          lruHash = {};
          freshEnd = staleEnd = null;
        },


        destroy: function() {
          data = null;
          stats = null;
          lruHash = null;
          delete caches[cacheId];
        },


        info: function() {
          return extend({}, stats, {size: size});
        }
      };


      /**
       * makes the `entry` the freshEnd of the LRU linked list
       */
      function refresh(entry) {
        if (entry != freshEnd) {
          if (!staleEnd) {
            staleEnd = entry;
          } else if (staleEnd == entry) {
            staleEnd = entry.n;
          }

          link(entry.n, entry.p);
          link(entry, freshEnd);
          freshEnd = entry;
          freshEnd.n = null;
        }
      }


      /**
       * bidirectionally links two entries of the LRU linked list
       */
      function link(nextEntry, prevEntry) {
        if (nextEntry != prevEntry) {
          if (nextEntry) nextEntry.p = prevEntry; //p stands for previous, 'prev' didn't minify
          if (prevEntry) prevEntry.n = nextEntry; //n stands for next, 'next' didn't minify
        }
      }
    }


    cacheFactory.info = function() {
      var info = {};
      forEach(caches, function(cache, cacheId) {
        info[cacheId] = cache.info();
      });
      return info;
    };


    cacheFactory.get = function(cacheId) {
      return caches[cacheId];
    };


    return cacheFactory;
  };
};

/**
 * @ngdoc object
 * @name ng.$templateCache
 *
 * @description
 * Cache used for storing html templates.
 *
 * See {@link ng.$cacheFactory $cacheFactory}.
 *
 * @constructor
 */
angular.core.$TemplateCacheProvider = function() {
  this.$get = ['$cacheFactory', function($cacheFactory) {
    return $cacheFactory('blockTypes');
  }];
};

angular.core.module.provider('$cacheFactory', angular.core.$CacheFactoryProvider);
angular.core.module.provider('$templateCache', angular.core.$TemplateCacheProvider);
