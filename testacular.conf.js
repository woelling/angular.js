files = [JASMINE, JASMINE_ADAPTER].
  concat('lib/closure-compiler/base.js src/apis.js src/auto/injector.js src/core/annotate.js src/Angular.js src/module.js src/core/Q.js src/ng/timeout.js src/core/Scope.js src/ng/window.js src/ng/log.js src/ng/exceptionHandler.js src/ng/parse.js src/ng/rootScope.js src/core/service/template.js src/core/service/block.js src/core/types.js src/core/service/anchor.js src/core/directive/inline.js src/core/Compile.js src/core/directive/directives.js src/core/Template.js src/ng/interpolate.js src/core/Directive.js src/core/service/selector.js src/core/service/compile.js src/core/_module.js src/export.js'.replace(' src/export.js', '').split(' ')).
  concat([
    'lib/jquery/jquery.js',
    'src/ngMock/angular-mocks.js',
    'test/core/**/*.js',
    'test/auto/**/*.js'
  ]);
