#!/bin/sh

COMPILE="java -jar lib/closure-compiler/compiler.jar"

FILES=`./lib/closure-compiler/closurebuilder.py --root=src/ --root=lib/closure-compiler/ --namespace=angular_export`
if [ -z "$FILES" ]; then
  exit 1
fi
FILES="src/runTimeTypes.js src/assert.js $FILES"
FLAT_FILES=`echo $FILES`

echo "files = [JASMINE, JASMINE_ADAPTER].
  concat('$FLAT_FILES'.replace(' src/export.js', '').split(' ')).
  concat([
    'lib/jquery/jquery.js',
    'src/ngMock/angular-mocks.js',
    'test/core/**/*.js',
    'test/auto/**/*.js',
    'test/runTimeTypesSpec.js'
  ]);" > testacular.conf.js

FLAGS="--output_wrapper (function(){%output%})() \
       --summary_detail_level 3 \
       --process_closure_primitives \
       --externs src/externs.js \
       --manage_closure_dependencies \
       --use_types_for_optimization \
       --closure_entry_point angular.core.module \
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

$COMPILE --js_output_file build/c-angular.js \
         --formatting PRETTY_PRINT \
         --compilation_level SIMPLE_OPTIMIZATIONS \
         $FLAGS --js $FILES \

exit;

$COMPILE --js_output_file build/c-angular.min.js \
         --compilation_level ADVANCED_OPTIMIZATIONS \
         $FLAGS --js $FILES \

