'use strict';

/**
 * @param {*} condition
 * @param {string=} error
 */
var ASSERT = function(condition, error) {
  if (!COMPILED) {
    if (condition === null || condition === undefined || condition === false) {
      debugger;
      throw new Error(error);
    }
  }
};
