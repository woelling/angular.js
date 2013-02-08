'use strict';

angular.module('core.test', ['core']).config(function($provide) {
  $provide.value('$rootElement', $('<div ng-app></div>'));
});

describe('core.test', function() {

  beforeEach(module('core.test'));

  var $rootScope, $rootElement, $blockTypeFactory;

  beforeEach(inject(function(_$blockTypeFactory_, _$rootElement_, _$rootScope_) {
    $blockTypeFactory = _$blockTypeFactory_;
    $rootElement = _$rootElement_;
    $rootScope = _$rootScope_;
  }));

  describe('template', function() {
    beforeEach(inject());


    it('should create a simple template', function() {
      $rootElement.html('<div></div>');

      var template = $blockTypeFactory('.', [
        ['.', ['[bind]', 'name']]
      ]);

      var block = template('.');

      block.attach($rootScope);

      $rootScope.name = 'misko';
      $rootScope.$apply();

      expect($rootElement.text()).toEqual('misko');
    });


    it('should create a nested template', function() {
      $rootElement.html('<ul class="ul"><!----></ul>');
      var li = $blockTypeFactory('<li></li>', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $blockTypeFactory('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.');
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual('<ul class="ul"><!----><li>misko</li><li>igor</li></ul>');
    });


    it('should create a nested template, but reuse block instances', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li></ul>');
      var li = $blockTypeFactory('.ul>1', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $blockTypeFactory('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.', [
        [li, 2]
      ]);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).
          toEqual('<ul class="ul"> <li class="a">misko</li><li class="b">igor</li></ul>');
    });


    it('should create a nested template, reuse block instances, discard the rest', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li><li>extra</li></ul>');
      var li = $blockTypeFactory('.ul>1', [
        ['.', ['[bind]', 'name']]
      ]);
      var ul = $blockTypeFactory('.', [
        ['.ul>0', ['[repeat]', 'name in names', li]]
      ]);

      var block = ul('.', [
        [li, 3]
      ]);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).
          toEqual('<ul class="ul"> <li class="a">misko</li><li class="b">igor</li></ul>');
    });


    it('should create a nested template', function() {
      $rootElement.html('<ul class="ul"><!----></ul>');
      var div = $blockTypeFactory('<div></div>', [
        ['.', ['[bind]', 'col']]
      ]);
      var li = $blockTypeFactory('<li><!----></li>', [
        ['.>0', ['[repeat]', 'col in cols', div]]
      ]);
      var ul = $blockTypeFactory('.', [
          ['.ul>0', ['[repeat]', 'cols in rows', li]]
      ]);

      var block = ul('.');
      block.attach($rootScope);

      $rootScope.rows = [['r0c0', 'r0c1'], ['r1c0', 'r1c1']];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual(
          '<ul class="ul">' +
            '<!---->' +
            '<li>' +
              '<!----><div>r0c0</div><div>r0c1</div>' +
            '</li>' +
            '<li>' +
              '<!----><div>r1c0</div><div>r1c1</div>' +
            '</li>' +
          '</ul>');
    });


    it('should create a nested template but reuse block instances', function() {
      $rootElement.html(
          '<ul class="ul">' +
            '<!---->' +
            '<li class="li">' +
              '<!----><div>A</div><div>B</div>' +
            '</li>' +
            '<li><!----></li>' +
          '</ul>');
      var div = $blockTypeFactory('.li>1', [
        ['.', ['[bind]', 'col']]
      ]);
      var li = $blockTypeFactory('.li', [
        ['.>0+2', ['[repeat]', 'col in cols', div]]
      ]);
      var ul = $blockTypeFactory('.', [
        ['.ul>0+2', ['[repeat]', 'cols in rows', li]]
      ]);

      var block = ul('.', [
        [li, [[div, 2]], 1]
      ]);
      block.attach($rootScope);

      $rootScope.rows = [['r0c0', 'r0c1'], ['r1c0', 'r1c1']];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual(
          '<ul class="ul">' +
            '<!---->' +
            '<li class="li">' +
              '<!----><div>r0c0</div><div>r0c1</div>' +
            '</li>' +
            '<li>' +
              '<!----><div>r1c0</div><div>r1c1</div>' +
            '</li>' +
          '</ul>');
    });
  });


  describe('directive injection', function() {
    it('should inject other directive', function(){
      var injectedB, b;

      function A(b) {
        injectedB = b;
      }
      A.$name = 'a';

      function B() {
        b = this;
      }
      B.$name = 'b';

      $blockTypeFactory('<div></div>', [
        ['.',  [A, null], [B, null]]
      ])();

      expect(b instanceof B).toBe(true);
      expect(injectedB).toBe(b);
    });
  });
});
