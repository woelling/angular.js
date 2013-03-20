angular.module('Animator', [])

  .controller('AppCtrl', function($scope) {
    $scope.items = [
      'one','two','three','four','five'
    ];
  })

  .animation('fade-enter-cb', function() {
    return {
      setup : function(element) {
        element.css('opacity',0);
        element.css('top',-element.height());
      },
      start : function(element, done, memo) {
        element.animate({
          'opacity':1,
          'top':0,
          duration: 2000
        }, done);
      }
    }
  })

  .animation('fade-leave-cb', function() {
    return {
      setup : function(element) {
        var height = element.height();
        return height;
      },
      start : function(element, done, memo) {
        element.animate({
          'opacity':0,
          'top':-memo,
          duration: 2000
        }, done);
      }
    };
  });
