$.prototype.ngFind = function(selector) {
  return $(angular.core.dom.select($(this), selector));
}
