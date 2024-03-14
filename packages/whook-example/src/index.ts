import { env } from 'node:process';
import { Knifecycle, constant } from 'knifecycle';
import {
  WHOOK_DEFAULT_PLUGINS,
  runServer as runBaseServer,
  prepareServer as prepareBaseServer,
  prepareEnvironment as prepareBaseEnvironment,
  prepareCommand as prepareBaseCommand,
  initAutoload,
  initAPIDefinitions,
} from '@whook/whook';
import initHTTPRouter from '@whook/http-router';
import { initErrorHandlerWithCORS } from '@whook/cors';
import wrapHTTPRouterWithSwaggerUI from '@whook/swagger-ui';
import { extractAppEnv } from 'application-services';
import type { DependencyDeclaration, Dependencies } from 'knifecycle';

/* Architecture Note #1: A Whook baked API
This API server uses the Whook engine. Thoses architecture
 notes will help you to master its features.

You can see a view of the full architecture document
 by running `npm run architecture` and opening the generated
 `ARCHITECTURE.md` file.
*/

const APP_ENVS = ['local', 'test', 'production'] as const;

export type AppEnv = (typeof APP_ENVS)[number];

/* Architecture Note #1.1: The main file

Per convention a Whook server main file must exports
 the following 3 functions to be composable.
*/

/* Architecture Note #1.1.1: runServer

The `runServer` function is intended to run the server
 and may be proxied as is, except in some e2e test cases
 where it can be useful to put mocks in (see
 [the E2E tests](./index.test.ts) coming with this project
 for a real world example).
*/
export async function runServer<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(
  innerPrepareEnvironment: ($?: T) => Promise<T> = prepareEnvironment,
  innerPrepareServer: (
    injectedNames: DependencyDeclaration[],
    $: T,
  ) => Promise<D> = prepareServer,
  injectedNames: DependencyDeclaration[] = [],
): Promise<D> {
  return runBaseServer(
    innerPrepareEnvironment,
    innerPrepareServer,
    injectedNames,
  );
}

/* Architecture Note #1.1.2: prepareServer

The `prepareServer` function is intended to prepare the server
 environment. It relies on the main environment but will be
 used only by the server, not the commands or build scripts.
*/
export async function prepareServer<
  D extends Dependencies,
  T extends Knifecycle = Knifecycle,
>(injectedNames: DependencyDeclaration[], $: T): Promise<D> {
  /* Architecture Note #1.1.2.1: server wrappers
  
  Add here any logic bound to the server only
   For example, here we add a Swagger UI page for
   development purpose.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter) as any);

  return await prepareBaseServer(injectedNames, $);
}

/* Architecture Note #1.1.3: prepareEnvironment

The `prepareEnvironment` one is intended to prepare the server environment
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
   that looks for handlers, configs and services for you in their
   respective folders. Of course, you can also write your own
   autoloader by creating a service with the same signature
   (see https://github.com/nfroidure/whook/blob/master/packages/whook/src/services/_autoload.ts).
  */
  $.register(initAutoload);

  /* Architecture Note #1.1.3.2: API definitions

  This service loads the API definitions directly by
   looking at your `src/handlers` folder. You can
   release this behavior by removing this line.
   Though, it is not recommended to not use the
   Whook's black magic ;).
  */
  $.register(initAPIDefinitions);

  /* Architecture Note #1.1.3.3: MAIN_FILE_URL

  The project main file allows autoloading features to work
   either with sources (in `src`) and files built (in `dist/`).
  */
  $.register(constant('MAIN_FILE_URL', import.meta.url));

  $.register(constant('APP_ENV', extractAppEnv<AppEnv>(env.APP_ENV, APP_ENVS)));
  /* Architecture Note #1.1.3.3: TRANSACTIONS

  The Whook HTTP Transaction service, maintains an internal
   hash that handles a list of the current running HTTP
   transactions.
  
  This line allows the [`getDiagnostic`](./src/handlers/getDiagnostic.ts)
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

  /* Architecture Note #4.6: WRAPPERS

  Wrappers are allowing you to override every
   handlers of your API with specific behaviors,
   here we add CORS and HTTP authorization support
   to all the handlers defined in the API.
  
  Beware that the order here matters, you will
   want CORS to be applied to the authorization
   wrapper responses.
  */
  $.register(
    constant('HANDLERS_WRAPPERS', [
      'wrapHandlerWithCORS',
      'wrapHandlerWithAuthorization',
    ]),
  );

  /* Architecture Note #1.1.3.4: WHOOK_PLUGINS
  
  Plugins allows you to add simple features to the Whook's core,
   to add some, just add the plugin module name here.
  
  You can also avoid Whook defaults by leaving it empty.
  */
  $.register(
    constant('WHOOK_PLUGINS', [
      ...WHOOK_DEFAULT_PLUGINS,
      '@whook/cors',
      '@whook/authorization',
    ]),
  );

  // Add the CORS wrapped error handler
  $.register(initErrorHandlerWithCORS);

  return $;
}

/* Architecture Note #1.1.4: prepareCommand

The `prepareCommand` function is intended to prepare the commands
 environment. It relies on the main environment but will be
 used only by the commands, not the server or build scripts.
*/

export async function prepareCommand<T extends Knifecycle>(
  innerPrepareEnvironment: ($?: T) => Promise<T> = prepareEnvironment,
  $: T = new Knifecycle() as T,
): Promise<T> {
  // you can add here any logic bound to the commands only
  return prepareBaseCommand(innerPrepareEnvironment, $);
}
