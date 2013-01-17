/**
 * Remove IDs from HTML.
 * @param {Node|string} obj HTML or DOM Element to cleanup.
 * @return {*|void} cleaned up HTML.
 */
function htmlIdClean(obj) {
  var html = '';

  if (typeof obj == 'object') {
    if (typeof obj.length != 'number') {
      obj = [obj];
    }
    for (var i = 0, ii = obj.length; i < ii; i++) {
      html += angular.mock.dump(obj[i]);
    }
  }
  return html.replace(/__ng_[\d\w]+/g, '__ng_ID');
}
