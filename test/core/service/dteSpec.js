'use strict';

angular.module('core.test', ['core']).config(function($provide) {
  $provide.value('$rootElement', $('<div ng-app></div>'));
});

describe('core.test', function() {

  beforeEach(module('core.test'));

  var $rootScope, $rootElement, $blockTypeFactory;
  var Repeat, Bind;

  var NDD = angular.core.NodeDirectiveDef;
  var DD = angular.core.DirectiveDef;
  var BC = angular.core.BlockCache;
  var s;

  beforeEach(inject(function(_$blockTypeFactory_, _$rootElement_, _$rootScope_, $directiveInjector) {
    $blockTypeFactory = _$blockTypeFactory_;
    $rootElement = _$rootElement_;
    $rootScope = _$rootScope_;

    Repeat = $directiveInjector.get('[repeat]');
    Bind = $directiveInjector.get('[bind]');

    s = bind(null, angular.core.dom.select, $rootElement);
  }));

  describe('template', function() {
    beforeEach(inject());


    it('should create a simple template', function() {
      $rootElement.html('<div></div>');

      var BlockType = $blockTypeFactory($rootElement, [
          new NDD('.', [
            new DD(Bind, 'name')
          ])
      ]);

      var block = new BlockType($rootElement);

      block.attach($rootScope);

      $rootScope.name = 'misko';
      $rootScope.$apply();

      expect($rootElement.text()).toEqual('misko');
    });


    it('should create a nested template', function() {
      $rootElement.html('<ul class="ul"><!----></ul>');
      var LI = $blockTypeFactory('<li></li>', [
        new NDD('.', [
          new DD(Bind, 'name')
        ])
      ]);
      var UL = $blockTypeFactory($rootElement, [
        new NDD('.ul>0', [
          new DD(Repeat, 'name in names', {'': LI})
        ])
      ]);

      var block = new UL($rootElement);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).toEqual('<ul class="ul"><!----><li>misko</li><li>igor</li></ul>');
    });


    it('should create a nested template, but reuse block instances', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li></ul>');
      var LI = $blockTypeFactory($rootElement.find('li').eq(0), [
        new NDD('.', [ new DD(Bind, 'name') ])
      ]);
      var UL = $blockTypeFactory($rootElement.find('ul'), [
        new NDD('.ul>0', [ new DD(Repeat, 'name in names', {'': LI}) ])
      ]);
      var lis = $rootElement.find('li');

      var block = new UL($rootElement, [
        new BC([LI(lis.eq(0)), LI(lis.eq(1))])
      ]);
      block.attach($rootScope);

      $rootScope.names = ['misko', 'igor'];
      $rootScope.$apply();

      expect($rootElement.html()).
          toEqual('<ul class="ul"> <li class="a">misko</li><li class="b">igor</li></ul>');
    });


    it('should create a nested template, reuse block instances, discard the rest', function() {
      $rootElement.html('<ul class="ul"> <li class="a"></li><li class="b"></li><li>extra</li></ul>');
      var LI = $blockTypeFactory($rootElement.ngFind('.ul>1'), [
        new NDD('.', [
          new DD(Bind, 'name')
        ])
      ]);
      var UL = $blockTypeFactory($rootElement, [
        new NDD('.ul>0', [
          new DD(Repeat, 'name in names', {'': LI})
        ])
      ]);
      var lis = $rootElement.find('li');

      var block = UL($rootElement, [
        new BC([LI(lis.eq(0)), LI(lis.eq(1)), LI(lis.eq(2))])
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
        new NDD('.', [new DD(Bind, 'col')])
      ]);
      var li = $blockTypeFactory('<li><!----></li>', [
        new NDD('.>0', [new DD(Repeat, 'col in cols', {'': div})])
      ]);
      var ul = $blockTypeFactory($rootElement, [
        new NDD('.ul>0', [new DD(Repeat, 'cols in rows', {'': li})])
      ]);

      var block = ul($rootElement);
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
      var div = $blockTypeFactory(s('.li>1'), [
        new NDD('.', [new DD(Bind, 'col')])
      ]);
      var li = $blockTypeFactory(s('.li'), [
        new NDD('.>0+2', [new DD(Repeat, 'col in cols', {'': div})])
      ]);
      var ul = $blockTypeFactory($rootElement, [
        new NDD('.ul>0+2', [new DD(Repeat, 'cols in rows', {'': li})])
      ]);

      var block = ul($rootElement, [
        new BC([
          li(s('.ul>1'), [
            new BC([
              div(s('.li>1')),
              div(s('.li>2'))
            ])
          ]),
          li(s('.ul>2'))
        ])
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
        new NDD('.',  [new DD(A), new DD(B)])
      ])();

      expect(b instanceof B).toBe(true);
      expect(injectedB).toBe(b);
    });
  });
});
