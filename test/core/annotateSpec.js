'use strict';

describe('annotate', function() {
  it('should verify argument list', function() {
    function abc(a, b, c) {}

    angular.annotate.$inject(['a', 'b', 'c'], abc);
    expect(abc.$inject).toEqual(['a', 'b', 'c']);

    expect(function() {
      angular.annotate.$inject(['a', 'b'], abc);
    }).toThrow();


    angular.annotate.$inject(['a', 'b'], abc, true);
    expect(abc.$inject).toEqual(['a', 'b']);
  })
});
