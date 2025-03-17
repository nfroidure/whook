/* Architecture Note #1: A Whook baked API
This API server uses the Whook engine. Those architecture
 notes will help you to master its features.

You can see a view of the full architecture document
 by running `npm run architecture` and opening the generated
 `ARCHITECTURE.md` file.
*/

/* Architecture Note #1.1: The main file

Per convention a Whook server main file must exports
 the following 3 functions to be composable.
*/

import { env, argv as _argv } from 'node:process';
import {
  Knifecycle,
  constant,
  type DependencyDeclaration,
  type Dependencies,
} from 'knifecycle';
import {
  WHOOK_DEFAULT_PLUGINS,
  runProcess as runBaseProcess,
  prepareProcess as prepareBaseProcess,
  prepareEnvironment as prepareBaseEnvironment,
  initAutoload,
  initDefinitions,
  initHTTPRouter,
} from '@whook/whook';
import { initErrorHandlerWithCORS, wrapDefinitionsWithCORS } from '@whook/cors';
import wrapHTTPRouterWithSwaggerUI from '@whook/swagger-ui';
import { extractAppEnv, initTimeMock } from 'application-services';
import initSecurityDefinitions from './services/SECURITY_DEFINITIONS.js';

/* Architecture Note #1.1.3.4: supported `APP_ENV` values

You can add more application environment here for several
 deployment targets.
*/
const APP_ENVS = ['local', 'test', 'staging', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

/* Architecture Note #1.1.1: runProcess

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
  injectedNames: DependencyDeclaration[] = [],
  argv: typeof _argv = _argv,
): Promise<D> {
  return runBaseProcess(
    innerPrepareEnvironment,
    innerPrepareProcess,
    injectedNames,
    argv,
  );
}

/* Architecture Note #1.1.2: prepareProcess

The `prepareProcess` function is intended to prepare the process
 environment.
*/
export async function prepareProcess<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(injectedNames: DependencyDeclaration[], $: T): Promise<D> {
  /* Architecture Note #1.1.2.1: server wrappers
  
  Add here any logic bound to the server only
   For example, here we add a Swagger UI page for
   development purpose.
  */
  $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));

  return await prepareBaseProcess(injectedNames, $);
}

/* Architecture Note #1.1.3: prepareEnvironment

The `prepareEnvironment` one is intended to prepare the process environment
*/
export async function prepareEnvironment<T extends Knifecycle>(
  $: T = new Knifecycle() as T,
): Promise<T> {
  /* Architecture Note #4: Services
  Whook is shipped with a lots of services aimed to
   ease your life.

  Handlers, services, commands can use services for their
   own needs. In fact handlers are services too so that
   you can reuse an handler inside another (for example to
   create a bulk API endpoint and run each handlers into it).

  Whook's service can come from:
  - the Whook's base environment
  - the plugins services (found in the `@whook/{plugin}/src/services` folder)
  - the project services (in the `src/services` folder)
  */
  $ = await prepareBaseEnvironment($);

  /* Architecture Note #1.1.3.1: Autoloader

  You can register any service/handler required to bootstrap
   the server env here manually, see Knifecycle for more infos
   https://github.com/nfroidure/knifecycle

  OR, like in this example, use the Whook `$autoload` service
   that looks for routes, crons, commands, configs and
   services for you in their respective folders. Of course,
   you can also write your own autoloader by creating a
   service with the same signature
   (see https://github.com/nfroidure/whook/blob/master/packages/whook/src/services/_autoload.ts).
  */
  $.register(initAutoload);

  /* Architecture Note #1.1.3.2: Definitions

  This service loads the definitions directly by
   looking at your `src` folder. You can
   release this behavior by removing this line.
   Though, it is not recommended to not use the
   Whook's black magic ;).

  A service wrapper is also used here to add CORS to
   the routes definitions.
  */
  $.register(wrapDefinitionsWithCORS(initDefinitions));

  /* Architecture Note #1.1.3.3: MAIN_FILE_URL

  The project main file allows auto loading features to work
   either with sources (in `src`) and files built (in `dist/`).
  */
  $.register(constant('MAIN_FILE_URL', import.meta.url));

  /* Architecture Note #1.1.3.4: APP_ENV

  Reading the `APP_ENV` from the process environment and defining
   it as a constant.
  */
  const APP_ENV = extractAppEnv<AppEnv>(env.APP_ENV, APP_ENVS);

  $.register(constant('APP_ENV', APP_ENV));

  /* Architecture Note #1.1.3.4: $overrides

  Setting the `knifecycle` `$overrides` service depending on the
   current `APP_ENV`. It allows to map services to different
   implementations.
  */
  $.register(
    constant(
      '$overrides',
      (await import(`./config/${APP_ENV}/overrides.js`)).default,
    ),
  );

  /* Architecture Note #1.1.3.6: TRANSACTIONS

  The Whook HTTP Transaction service, maintains an internal
   hash that handles a list of the current running HTTP
   transactions.
  
  This line allows the [`getDiagnostic`](./src/routes/getDiagnostic.ts)
   handler to get access to it in order to return the
   current transactions.

  Simply try it like that:
  ```sh
  # start the server
  PORT=8080 npm run dev &
  SRV_PID=$!;
  sleep 3;

  # Run an delayed handler
  curl -X 'GET' 'http://localhost:8080/v8/delay?duration=3000' &

  # get diagnostic data (you will see the 2 running handlers displayed)
  curl -X 'GET' 'http://localhost:8080/v8/openAPI' \
   -H 'accept: application/json' -H 'Authorization: Fake admin|1|1';

  echo "wait $SRV_PID";
  sleep 1 && kill -s SIGTERM "$SRV_PID" &
  wait "$SRV_PID";
  ```
  */
  $.register(constant('TRANSACTIONS', {}));

  /* Architecture Note #4.6: ROUTES_WRAPPERS

  Wrappers are allowing you to override every
   routes of your API with specific behaviors,
   here we add CORS and HTTP authorization support
   to all the routes defined in the API.
  
  Beware that the order here matters, you will
   want CORS to be applied to the authorization
   wrapper responses.
  */
  $.register(
    constant('ROUTES_WRAPPERS_NAMES', [
      'wrapRouteHandlerWithCORS',
      'wrapRouteHandlerWithAuthorization',
    ]),
  );

  /* Architecture Note #1.1.3.7: WHOOK_PLUGINS
  
  Plugins allows you to add simple features to the Whook's core,
   to add some, just add the plugin module name here.
  
  You can also avoid Whook defaults by leaving it empty.
  */
  $.register(
    constant('WHOOK_PLUGINS', [
      ...WHOOK_DEFAULT_PLUGINS,
      '@whook/cors',
      '@whook/authorization',
      '@whook/aws-lambda',
    ]),
  );

  // Add the CORS wrapped error handler
  $.register(initErrorHandlerWithCORS);

  // Add the time mock service for testing
  $.register(initTimeMock);

  $.register(initSecurityDefinitions);

  return $;
}
