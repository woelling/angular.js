'use strict';

/**
 * @template T
 * @param {T} value
 * @param {string=} error
 * @return {T}
 */
var ASSERT = function(value, error) {
  if (!COMPILED) {
    if (value === null || value === undefined || value === false) {
      throw new Error(error);
    }
  }
  return value;
};

/**
 * @template T
 * @param {T} left
 * @param {T} right
 */
var ASSERT_EQ = function(left, right) {
  if (!COMPILED) {
    if (left != right) {
      throw new Error(STRINGIFY(left) + ' != ' + STRINGIFY(right));
    }
  }
};
