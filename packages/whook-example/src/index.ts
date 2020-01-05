import Knifecycle, { constant, Services } from 'knifecycle';
import {
  runServer as runBaseServer,
  prepareServer as prepareBaseServer,
  prepareEnvironment as prepareBaseEnvironment,
  initAutoload,
  initAPIDefinitions,
} from '@whook/whook';
import initHTTPRouter from '@whook/http-router';
import wrapHTTPRouterWithSwaggerUI from '@whook/swagger-ui';

// Per convention a Whook server main file must export
//  the following 3 functions to be composable:

// The `runServer` function is intended to run the server
// and may be proxied as is except in some e2e test cases
export async function runServer(
  innerPrepareEnvironment = prepareEnvironment,
  innerPrepareServer = prepareServer,
  injectedNames = [],
) {
  return runBaseServer(
    innerPrepareEnvironment,
    innerPrepareServer,
    injectedNames,
  );
}

// The `prepareServer` function is intended to prepare the server
export async function prepareServer<S = Services>(
  injectedNames: any[] = [],
  $: Knifecycle = new Knifecycle(),
): Promise<S> {
  // Add here any logic bounded to the server only
  // For example, here we add a Swagger UI page for
  // development purpose
  $.register(wrapHTTPRouterWithSwaggerUI(initHTTPRouter));

  return await prepareBaseServer(injectedNames, $);
}

// The `prepareEnvironment` one is intended to prepare the server environment
export async function prepareEnvironment(
  $: Knifecycle = new Knifecycle(),
): Promise<Knifecycle> {
  $ = await prepareBaseEnvironment($);

  // You can register any service/handler required to bootstrap
  // the server env here manually see Knifecycle for more infos
  // https://github.com/nfroidure/knifecycle

  // OR, like in this example, use the Whook `$autoload` service
  // that looks for handlers, configs and services for you in their
  // respective folders. Of course, you can also write your own
  // autoloader
  $.register(initAutoload);

  // This service loads the API definitions directly by
  // looking at your `src/handlers` folder. You can
  // realease this behavior by removing this line
  $.register(initAPIDefinitions);

  // You have to declare the project main file directory
  // to allow autoloading features to work with it either
  // in development and production (files built in `dist/`)
  $.register(constant('PROJECT_SRC', __dirname));

  // Placeholder for the diagnostic endpoint to return current
  // transactions
  $.register(constant('TRANSACTIONS', {}));

  // Setup your own whook plugins or avoid whook default by leaving it empty
  $.register(constant('WHOOK_PLUGINS', ['@whook/cli', '@whook/whook']));

  return $;
}
