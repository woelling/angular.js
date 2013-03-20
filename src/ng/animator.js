'use strict';

// NOTE: this is a pseudo directive.

/**
 * @ngdoc directive
 * @name ng.directive:ngAnimate
 *
 * @description
 * The `ngAnimate` directive provides developers with an easy way to attach animations to pre-existing ng directives as well as custom directives.
 * Common angular directives such as <strong>ngShow</strong>, <strong>ngHide</strong>, <strong>ngRepeat</strong>, <strong>ngInclude</strong>, <strong>ngSwitch</strong>, and <strong>ngView</strong> all support various animation hooks that can be made
 * use of via the ngAnimate directive. This means that you must plug in the ng-animate directive onto the same element as the other directive is on
 * (like ngRepeat, ngInclude, etc...).
 *
 * Here is a full breakdown of which angularjs (ng) directives provide what callback events:
 *
 * * ngRepeat — enter, leave and move
 * * ngView — enter and leave
 * * ngInclude — enter and leave
 * * ngSwitch — enter and leave
 * * ngShow & ngHide - show and hide respectively
 * You can find out more information about animations upon visiting each directive page.
 * 
 * Assigning animations to directives happens within the ng-animate attribute and follows mapping pattern. Below is an example of how
 * to attach animations to an element.
 *
 *         <!-- you can also use data-ng-animate or x-ng-animate as well -->
 *         <ANY ng-directive ng-animate="event1: animationFn; event2: animationFn2"></ANY>
 *
 * @param {mapping expression} ngAnimate determines which animations will animate on which animation events.
 *     then the element is shown or hidden respectively.
 *
 */


var $AnimatorProvider = function() {
  this.$get = ['$animation', '$window', '$sniffer', function($animation, $window, $sniffer) {
    return function(attrs) {
      var ngAnimateAttr = attrs.ngAnimate;
      var animation = {};
      var classes = {};

      if (ngAnimateAttr) {
        //SAVED: http://rubular.com/r/0DCBzCtVml
        var matches = ngAnimateAttr.split(/(?:([-\w]+)\ *:\ *([-\w]+)(?:;|$))+/g);
        if(!matches) {
          throw Error("Expected ngAnimate in form of 'animation: definition; ...;' but got '" + ngAnimateAttr + "'.");
        }
        if (matches.length == 1) {
          classes.enter = matches[0] + '-enter';
          classes.leave = matches[0] + '-leave';
          classes.move = matches[0] + '-move';
          classes.show = matches[0] + '-show';
          classes.hide = matches[0] + '-hide';
        } else {
          for(var i=1; i < matches.length; i++) {
            var name  = matches[i++];
            var value = matches[i++];
            if(name && value) {
              classes[name] = value;
            }
          }
        }
      }

      animation.enter = animateAction(classes.enter, $animation(classes.enter), insert, noop);
      animation.leave = animateAction(classes.leave, $animation(classes.leave), noop, remove);
      animation.move = animateAction(classes.move, $animation(classes.move), move, noop);
      animation.show = animateAction(classes.show, $animation(classes.show), noop, show);
      animation.hide = animateAction(classes.hide, $animation(classes.hide), noop, hide);
      return animation;
    }

    function show(element) {
      element.css('display', 'block');
    }

    function hide(element) {
      element.css('display', 'none');
    }

    function insert(element, parent, after) {
      if (after) {
        after.after(element);
      } else {
        parent.append(element);
      }
    }

    function remove(element) {
      element.remove();
    }

    function move(element, parent, after) {
      remove(element);
      insert(element, parent, after);
    }

    function animateAction(className, animationPolyfill, beforeFn, afterFn) {
      if (!className) {
        return function(element, parent, after) {
          beforeFn(element, parent, after);
          afterFn(element, parent, after);
        }
      } else {
        var setupClass = className + '-setup';
        var startClass = className + '-start';

        return function(element, parent, after) {
          if (element.length == 0) return done();

          var memento;

          element.addClass(setupClass);
          if (animationPolyfill && animationPolyfill.setup) {
            memento = animationPolyfill.setup(element);
          }
          beforeFn(element, parent, after);

          // $window.setTimeout(process, 0); this was causing the element not to animate
          // keep at 1 for animation dom rerender
          $window.setTimeout(beginAnimation, 1);

          function beginAnimation() {
            element.addClass(startClass);
            if (animationPolyfill && animationPolyfill.start) {
              animationPolyfill.start(element, done, memento);
            } else if (isFunction($window.getComputedStyle)) {
              var vendorTransitionProp = $sniffer.vendorPrefix.toLowerCase() + 'Transition';
              var w3cTransitionProp = 'transition'; //one day all browsers will have this

              var durationKey = 'Duration';
              var duration = 0;
              //we want all the styles defined before and after
              forEach(element, function(element) {
                var globalStyles = $window.getComputedStyle(element) || {};
                var localStyles = element.style || {};
                duration = Math.max(
                    parseFloat(localStyles[w3cTransitionProp     + durationKey]) ||
                    parseFloat(localStyles[vendorTransitionProp  + durationKey]) ||
                    parseFloat(globalStyles[w3cTransitionProp    + durationKey]) ||
                    parseFloat(globalStyles[vendorTransitionProp + durationKey]) ||
                    0,
                    duration);
              });

              $window.setTimeout(done, duration * 1000);
            } else {
              done();
            }
          }

          function done() {
            afterFn(element, parent, after);
            element.removeClass(setupClass);
            element.removeClass(startClass);
          }
        }
      }
    }
  }];
};
