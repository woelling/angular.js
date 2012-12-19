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
    var element = angular.element('<div bind="name"></div>');
    var template = $compile(element);

    $rootScope.name = 'angular';
    template(element).attach($rootScope);

    expect(element.text()).toEqual('');
    $rootScope.$digest();
    expect(element.text()).toEqual('angular');
  }));


  it('should compile repeater', inject(function() {
    var element = angular.element('<div><div repeat="item in items" bind="item"></div></div>');
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
    var element = angular.element(
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


  it('should throw error if unclosed comment', inject(function() {
    expect(function() {
      $compile('<div><!--[repeat=item in items]--></div>');
    }).toThrow('Missing ending comment: [/repeat]');
  }));


  it('should compile nested repeater', inject(function() {
    var element = angular.element(
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
            block = $anchor.newBlock('switch-when=' + value) ||
                $anchor.newBlock('switch-default=');
            if (block) {
              block.insertAfter($anchor);
              block.attach(scope.$new());
            } else {
              dump("no block found")
            }
          });
        }
      }

      $provide.value('directive:[switch]', Switch);
    }));

    it('should transclude multiple templates', inject(function($rootScope) {
      var element = angular.element(
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
      var element = angular.element(
          '<div><span two one>{{test}}</span></div>');
      var block = $compile(element)(element);

      $rootScope.test = 0;
      block.attach($rootScope);
      $rootScope.$apply();

      expect(element.html()).toEqual(
        '<!--[one]-->' +
          '<!--[two]-->' +
            '<span class="__ng_003">2</span>' +
          '<!--[/two]-->' +
        '<!--[/one]-->');
    });
  });


  describe("interpolation", function() {
    it('should interpolate attribute nodes', inject(function() {
      var element = angular.element('<div test="{{name}}"></div>');
      var template = $compile(element);

      $rootScope.name = 'angular';
      template(element).attach($rootScope);

      $rootScope.$digest();
      expect(element.attr('test')).toEqual('angular');
    }));


    it('should interpolate text nodes', inject(function() {
      var element = angular.element('<div>{{name}}</div>');
      var template = $compile(element);

      $rootScope.name = 'angular';
      template(element).attach($rootScope);

      expect(element.text()).toEqual('');
      $rootScope.$digest();
      expect(element.text()).toEqual('angular');
    }));
  });
});
