#!/bin/sh

COMPILE="java -jar lib/closure-compiler/compiler.jar"

FILES="src/Angular.js \
       src/apis.js \
       src/module.js \
       src/auto/injector.js \
       src/core/_module.js \
       src/ng/rootScope.js \
       src/ng/exceptionHandler.js \
       src/ng/log.js \
       src/ng/window.js \
       src/ng/parse.js \
       src/ng/interpolate.js \
       src/core/Anchor.js \
       src/core/Block.js \
       src/core/Directive.js \
       src/core/Scope.js \
       src/core/directive/inline.js \
       src/core/directive/directives.js \
       src/core/service/anchor.js \
       src/core/service/block.js \
       src/core/service/selector.js \
       src/core/service/compile.js \
       src/core/service/template.js \
       src/export.js \
       "

FLAGS="--output_wrapper (function(){%output%})() \
       --summary_detail_level 3 \
       --manage_closure_dependencies \
       --externs src/externs.js \
       --language_in ECMASCRIPT5_STRICT \
       --jscomp_off nonStandardJsDocs \
       --jscomp_error accessControls \
       --jscomp_error ambiguousFunctionDecl \
       --jscomp_error checkRegExp \
       --jscomp_error checkTypes \
       --jscomp_error checkVars \
       --jscomp_error const \
       --jscomp_error constantProperty \
       --jscomp_error deprecated \
       --jscomp_error duplicateMessage \
       --jscomp_error es5Strict \
       --jscomp_error externsValidation \
       --jscomp_error fileoverviewTags \
       --jscomp_error globalThis \
       --jscomp_error internetExplorerChecks \
       --jscomp_error invalidCasts \
       --jscomp_error missingProperties \
       --jscomp_error strictModuleDepCheck \
       --jscomp_error typeInvalidation \
       --jscomp_error undefinedNames \
       --jscomp_error undefinedVars \
       --jscomp_error unknownDefines \
       --jscomp_error uselessCode \
       --jscomp_error visibility \
       "

#OPTIMIZATION=SIMPLE_OPTIMIZATIONS
OPTIMIZATION=ADVANCED_OPTIMIZATIONS


cat src/angular.prefix $FILES src/angular.suffix > build/c-angular.js

$COMPILE --js_output_file build/c-angular.min.js \
         --formatting PRETTY_PRINT \
         --compilation_level $OPTIMIZATION \
         $FLAGS --js lib/closure-compiler/base.js $FILES \

