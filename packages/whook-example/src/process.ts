import { argv as _argv } from 'node:process';
import {
  Knifecycle,
  constant,
  type DependencyDeclaration,
  type Dependencies,
} from 'knifecycle';
import {
  runProcess as runBaseProcess,
  prepareProcess as prepareBaseProcess,
  initHTTPRouter,
} from '@whook/whook';

import wrapHTTPRouterWithSwaggerUI from '@whook/swagger-ui';
import { wrapHTTPRouterWithOTel } from '@whook/otel';

import {
  WHOOK_PLUGINS,
  DEFAULT_INJECTED_NAMES,
  prepareEnvironment,
} from './index.js';

/* Architecture Note #1.2: The process file

Per convention a Whook server process file must exports
 the following 2 functions to be composable.
*/

/* Architecture Note #1.2.1: runProcess

The `runProcess` function is intended to run the server
 and may be proxied as is, except in some e2e test cases
 where it can be useful to put mocks in (see
 [the E2E tests](./index.test.ts) coming with this project
 for a real world example).
*/
export async function runProcess<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  innerPrepareEnvironment: ($?: T) => Promise<T> = prepareEnvironment,
  innerPrepareProcess: (
    injectedNames: DependencyDeclaration[],
    $: T,
  ) => Promise<D> = prepareProcess,
  injectedNames: DependencyDeclaration[] = DEFAULT_INJECTED_NAMES,
  argv: typeof _argv = _argv,
): Promise<D> {
  return runBaseProcess(
    innerPrepareEnvironment,
    innerPrepareProcess,
    injectedNames,
    argv,
  );
}

/* Architecture Note #1.2.2: prepareProcess

The `prepareProcess` function is intended to prepare
the local process environment. Put here anything you
don't want to end up in the final build process.
*/
export async function prepareProcess<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(injectedNames: DependencyDeclaration[], $: T): Promise<D> {
  /* Architecture Note #1.2.2.1: server wrappers
  
  Add here any logic bound to the dev server only
   For example, here we add a Swagger UI page for
   development purpose and open telemetry wrapper.
  */
  $.register(
    wrapHTTPRouterWithOTel(wrapHTTPRouterWithSwaggerUI(initHTTPRouter)),
  );

  /* Architecture Note #1.2.2.2: Dev WHOOK_PLUGINS

  Those plugins will only be used locally. The
  `@whook/dev` one is intended to be installed in
  the development dependencies. The `@whook/otel`
  one too, but may in some circumstances be shipped
  to production for debug / statistics collection.
   */
  $.register(
    constant('WHOOK_PLUGINS', [
      WHOOK_PLUGINS[0],
      '@whook/otel',
      ...WHOOK_PLUGINS.slice(1),
      '@whook/dev',
    ]),
  );

  return await prepareBaseProcess(injectedNames, $);
}
