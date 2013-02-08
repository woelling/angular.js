'use strict';

goog.provide('angular.core.Accessor');
goog.provide('angular.core.AccessorFactory');
goog.provide('angular.core.AttrAccessor');
goog.provide('angular.core.DirectiveInfo');
goog.provide('angular.core.DirectiveType');
goog.provide('angular.core.DirectiveDef')
goog.provide('angular.core.NodeDirectiveDef')
goog.provide('angular.core.NodeList');


/**
 * @typedef {{
 *   $priority: number,
 *   $transclude: string
 * }}
 */
angular.core.DirectiveType;

/**
 * @typedef {{
 *   Directive: angular.core.DirectiveType,
 *   selector: string,
 *   element: Node,
 *   pseudoElement: boolean,
 *   name: string,
 *   value: string,
 *   childNodes: Array.<Node>
 * }}
 */
angular.core.DirectiveInfo;



/**
 * @typedef {function(string):angular.core.Accessor}
 */
angular.core.AccessorFactory;

/**
 * When used with parameter then the accessor acts like setter, when
 * used without argument it is a getter.
 *
 * @typedef {function(*=):*}
 */
angular.core.Accessor;

/**
 * TODO: define
 * @typedef Array
 */
angular.core.ElementDirectivesDecl;

/**
 * @typedef {Array.<Node>|NodeList}
 */
angular.core.NodeList;

/**
 * @typedef {
 *   function(string):string
 * }
 */
angular.core.AttrAccessor;


/**
 * @typedef {Array.<Function|string>}
 */
angular.core.NodeDirectiveDef;

/**
 * @typedef {Array.<string|angular.core.NodeDirectiveDef>}
 */
angular.core.DirectiveDef;









