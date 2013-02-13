'use strict';

var ngAnimateDirective = function($animation) {
  return {
    priority : 9000, //this needs to always be higher than ngRepeat
    controller: AnimationController,
    require: 'ngAnimate',
    link: function(scope, element, attrs, animationCntl) {
      var ngAnimateAttr = attrs.ngAnimate;

      //SAVED: http://rubular.com/r/0DCBzCtVml
      var parsed = {};
      var matches = ngAnimateAttr.split(/(?:([-\w]+)\ *:\ *([-\w]+)(?:;|$))+/g);
      for(var i=1; i < matches.length; i++) {
        var name  = matches[i++];
        var value = matches[i++];
        if(name && value) {
          parsed[name] = value;
        }
      }

      if(parsed.enter)  animationCntl.set('enter', $animation(parsed.enter));
      if(parsed.leave)  animationCntl.set('leave', $animation(parsed.leave));
      if(parsed.move)   animationCntl.set('move',  $animation(parsed.move));
    }
  };
};

var AnimationController = function() {
  this.animators = {};

  //TODO use a local injector
  var $injector = angular.injector(['ng']);
  var $animation = $injector.get('$animation');
  this.set('enter', $animation('noopEnter'));
  this.set('leave', $animation('noopLeave'));
  this.set('move',  $animation('noopMove'));
};

AnimationController.prototype = {
  set: function(name, animator) {
    if(typeof(animator) != 'function') {
      throw Error("'" + name + "' does not have a properly defined animation function");
    }
    this.animators[name] = animator;
  },

  animate: function(name, node, parent, after) {
    var animator = this.animators[name];
    if(typeof(animator) != 'function') {
      throw Error("'" + name + "' animator method was not found");
    }
    animator(node, parent, after);
  }
};
