'use strict';

var noopAnimations = {
  'noopEnter' : function() {
    return function(node, parent, after) {
      after ? after.after(node) : parent.append(node);
    };
  },

  'noopLeave' : function() {
    return function(node, parent, after) {
      node.remove();
    };
  },

  'noopMove' : function() {
    return function(node, parent, after) {
      after ? after.after(node) : parent.append(node);
    };
  }
};

$AnimationProvider.$inject = ['$provide'];
function $AnimationProvider($provide) {
  var suffix = 'Animation';

  var register = function(name, factory) {
    name = camelCase(name) + suffix;
    $provide.factory(name, factory);
  };
  this.register = register;

  this.$get = function($injector) {
    return function(name) {
      name = camelCase(name) + suffix;
      return $injector.get(name);
    }
  };

  $provide.factory('$noopAnimator', function($animation) {
    return new AnimationController($animation);
  });

  angular.forEach(noopAnimations, function(animator, name ){
    register(name, animator);
  });
}
