#!/bin/sh

COMPILE="java -jar lib/closure-compiler/compiler.jar"

FILES=`./lib/closure-compiler/closurebuilder.py --root=src/ --root=lib/closure-compiler/ --namespace=angular_export`

FLAGS="--output_wrapper (function(){%output%})() \
       --summary_detail_level 3 \
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
         $FLAGS --js $FILES \

