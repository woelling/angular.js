files = [JASMINE, JASMINE_ADAPTER].
  concat('src/runTimeTypes.js src/log.js src/assert.js lib/closure-compiler/base.js src/apis.js src/auto/injector.js src/core/annotate.js src/Angular.js src/core/service/_types.js src/core/directive/directives.js src/module.js src/ng/window.js src/ng/log.js src/ng/exceptionHandler.js src/ng/parse.js src/ng/interpolate.js src/core/Q.js src/ng/timeout.js src/core/service/dom.js src/core/service/_interfaces.js src/core/service/selector.js src/core/service/compile.js src/core/service/block.js src/core/service/block_type.js src/core/directive/inline.js src/core/Scope.js src/ng/rootScope.js src/core/service/block_list.js src/core/_module.js src/export.js'.replace(' src/export.js', '').split(' ')).
  concat([
    'lib/jquery/jquery.js',
    'src/ngMock/angular-mocks.js',
    'test/core/**/*.js',
    'test/auto/**/*.js',
    'test/runTimeTypesSpec.js'
  ]);
