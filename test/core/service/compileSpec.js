'use strict';

describe('dte.compiler', function() {
  var $compile, $rootScope;

  beforeEach(module('core.test', function() {
    return function(_$compile_, _$rootScope_) {
      $compile = _$compile_;
      $rootScope = _$rootScope_;
    }
  }));

  it('should compile basic hello world', inject(function() {
    var element = $('<div bind="name"></div>');
    var template = $compile(element);

    $rootScope.name = 'angular';
    template(element).attach($rootScope);

    expect(element.text()).toEqual('');
    $rootScope.$digest();
    expect(element.text()).toEqual('angular');
  }));


  it('should compile repeater', inject(function() {
    var element = $('<div><div repeat="item in items" bind="item"></div></div>');
    var template = $compile(element);

    $rootScope.items = ['A', 'b'];
    template(element).attach($rootScope);

    expect(element.text()).toEqual('');
    $rootScope.$digest();
    expect(element.text()).toEqual('Ab');

    $rootScope.items = [];
    $rootScope.$digest();
    expect(element.html()).toEqual('<!--[repeat=item in items]--><!--[/repeat]-->');
  }));


  it('should compile multi-root repeater', inject(function() {
    var element = $(
        '<div>' +
          '<!--[repeat=item in items]-->' +
            '<div bind="item"></div>' +
            '<span bind="item"></span>' +
          '<!--[/repeat]-->' +
        '</div>');
    var template = $compile(element);

    $rootScope.items = ['A', 'b'];
    template(element).attach($rootScope);

    expect(element.text()).toEqual('');
    $rootScope.$digest();
    expect(element.text()).toEqual('AAbb');

    $rootScope.items = [];
    $rootScope.$digest();
    expect(element.html()).toEqual('<!--[repeat=item in items]--><!--[/repeat]-->');
  }));


  it('should compile text', inject(function() {
    var element = $('<div>{{name}}<span>!</span></div>').contents();
    element.remove();

    var template = $compile(element);

    $rootScope.name = 'OK';
    var block = template();

    element = $(block.elements);

    block.attach($rootScope);

    expect(element.text()).toEqual('!');
    $rootScope.$digest();
    expect(element.text()).toEqual('OK!');
  }));


  it('should throw error if unclosed comment', inject(function() {
    expect(function() {
      $compile('<div><!--[repeat=item in items]--></div>');
    }).toThrow('Missing ending comment: [/repeat]');
  }));


  it('should compile nested repeater', inject(function() {
    var element = $(
        '<div>' +
          '<ul repeat="lis in uls">' +
             '<li repeat="li in lis" bind="li"></li>' +
          '</ul>' +
        '</div>');
    var template = $compile(element);

    $rootScope.uls = [['A'], ['b']];
    template(element).attach($rootScope);

    expect(element.text()).toEqual('');
    $rootScope.$digest();
    expect(element.text()).toEqual('Ab');
  }));


  describe('transclusion', function() {
    beforeEach(module(function($provide) {
      Switch.$transclude = '>[switch-when],>[switch-default]';
      Switch.$inject=['$anchor', '$value'];
      function Switch($anchor, $value) {
        var block;

        this.attach = function(scope) {
          scope.$watch($value, function(value) {
            if (block) {
              block.remove();
            }
            var type = 'switch-when=' + value;

            if (!$anchor.blockTypes.hasOwnProperty(type)) {
              type = 'switch-default='
            }
            block = $anchor.newBlock(type);
            block.insertAfter($anchor);
            block.attach(scope.$new());
          });
        }
      }

      $provide.value('directive:[switch]', Switch);
    }));

    it('should transclude multiple templates', inject(function($rootScope) {
      var element = $(
          '<div switch="name">' +
              '<span switch-when="a">when</span>' +
              '<span switch-default>default</span>' +
          '</div>');
      var template = $compile(element);
      var block = template(element);

      block.attach($rootScope);

      $rootScope.name = 'a';
      $rootScope.$apply();
      expect(element.text()).toEqual('when');

      $rootScope.name = 'abc';
      $rootScope.$apply()
      expect(element.text()).toEqual('default');
    }));
  });


  it('should allow multiple transclusions on one element and in correct order.', function() {
    module(function($provide) {
      var One = function($anchor) {
        this.attach = function(scope) {
          var block = $anchor.newBlock();
          var childScope = scope.$new();

          childScope.test = childScope.test + 1;
          block.insertAfter($anchor);
          block.attach(childScope);
        }
      };
      One.$transclude = '.';
      One.$priority = 100;

      var Two = function($anchor) {
        this.attach = function(scope) {
          var block = $anchor.newBlock();
          var childScope = scope.$new();

          childScope.test = childScope.test + 1;
          block.insertAfter($anchor);
          block.attach(childScope);
        }
      };
      Two.$transclude = '.';

      $provide.value({ 'directive:[one]': One, 'directive:[two]': Two });
    });
    inject(function($compile) {
      var element = $(
          '<div><span two one>{{test}}</span></div>');
      var block = $compile(element)(element);

      $rootScope.test = 0;
      block.attach($rootScope);
      $rootScope.$apply();

      expect(htmlIdClean(element)).toEqual(
        '<div class="__ng_ID">' +
          '<!--[one]-->' +
            '<!--[two]-->' +
              '<span two="" one="" class="__ng_ID">2</span>' +
            '<!--[/two]-->' +
          '<!--[/one]-->' +
        '</div>');
    });
  });


  describe("interpolation", function() {
    it('should interpolate attribute nodes', inject(function() {
      var element = $('<div test="{{name}}"></div>');
      var template = $compile(element);

      $rootScope.name = 'angular';
      template(element).attach($rootScope);

      $rootScope.$digest();
      expect(element.attr('test')).toEqual('angular');
    }));


    it('should interpolate text nodes', inject(function() {
      var element = $('<div>{{name}}</div>');
      var template = $compile(element);

      $rootScope.name = 'angular';
      template(element).attach($rootScope);

      expect(element.text()).toEqual('');
      $rootScope.$digest();
      expect(element.text()).toEqual('angular');
    }));
  });


  describe('directive generation', function() {
    var Bind, Repeat;

    beforeEach(module(function($provide) {
      function Generate() {};

      Generate.$generate = function(value) {
        expect(value).toEqual('abc');

        return [['[bind]', 'name'], ['[repeat]', 'name in names']];
      }

      $provide.value('directive:[generate]', Generate);
    }));


    it('should generate directive from a directive', inject(function() {
      var element = $('<ul><li generate="abc"></li></ul>');
      var blockType = $compile(element);
      var block = blockType(element);

      block.attach($rootScope);
      $rootScope.names = ['james;', 'misko;'];
      $rootScope.$apply();

      expect(element.text()).toEqual('james;misko;');
    }));
  });


  describe('reuse DOM instances', function() {
    xit('should reuse repeat instances', inject(function() {
      var element = $('<ul><li repeat="i in items" instance="1" bind="i">first</li><li instance="2">second</li></ul>');
      var blockCache = [];
      var ulBlockType = $compile(element, blockCache);

      if (false) {
        var liBlockType = $compile('<li bind="i"></li>');
        blockCache.push(new angular.core.BlockCache([
          liBlockType(element.find('[instance=1]')),
          liBlockType(element.find('[instance=2]'))
        ]))
      }

      var block = ulBlockType(element, blockCache);

      block.attach($rootScope);
      $rootScope.items = ['A', 'B'];
      $rootScope.$apply();

      expect(element.text()).toEqual('AB');
      expect(element.html()).toEqual('<li repeat="i in items" instance="1" bind="i">A</li><li instance="2">B</li>');
    }));
  });
});
