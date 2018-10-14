import { noop, compose } from '../libs/utils';
import { initializer, constant } from 'knifecycle';
import {
  flattenSwagger,
  getSwaggerOperations,
} from 'swagger-http-router/dist/utils';
import path from 'path';

/* Architecture Note #4: `$autoload` service
The default Whook autoloader provides a simple way to
 load the constants, services and handlers of a Whook
 project.
*/
export default initializer(
  {
    name: '$autoload',
    type: 'service',
    inject: [
      'PWD',
      'NODE_ENV',
      '?SERVICE_NAME_MAP',
      '?INITIALIZER_PATH_MAP',
      '?WRAPPERS',
      '?log',
    ],
    options: { singleton: true },
  },
  initAutoload,
);

async function initAutoload({
  PWD,
  NODE_ENV,
  SERVICE_NAME_MAP = {},
  INITIALIZER_PATH_MAP = {},
  WRAPPERS,
  log = noop,
}) {
  /* Architecture Note #4.1: Configuration auto loading
  Loading the configuration files is done according to the `NODE_ENV`
   environment variable. It basically requires a configuration hash
   where the keys are Knifecycle constants.

  Let's load the configuration files as a convenient way
   to create constants on the fly
  */
  const configPath = path.join(PWD, 'config', NODE_ENV, 'config');

  log('debug', `Loading configuration from ${configPath}.`);

  const CONFIGS = require(configPath).default;

  // The following let has to be declared before the next line since
  // it is a recurring call that use the API variable
  let API;

  /* Architecture Note #4.2: Wrappers auto loading
  We cannot inject the `WRAPPERS` in the auto loader when
   it is dynamically loaded so doing during the auto loader
   initialization if needed.
  */
  if (null == WRAPPERS) {
    try {
      const { initializer: wrapperInitializer } = await $autoload('WRAPPERS');

      WRAPPERS = await wrapperInitializer({});
    } catch (err) {
      log('debug', 'Could not find any API wrapper:', err);
      WRAPPERS = [];
    }
  }
  const wrapHandler = WRAPPERS.length ? compose(...WRAPPERS) : noop;

  /* Architecture Note #4.3: API auto loading
  We cannot inject the `API` in the auto loader since
   it is dynamically loaded so doing during the auto loader
   initialization.
  */
  const { initializer: apiInitializer } = await $autoload('API');
  API = await apiInitializer({ CONFIG: CONFIGS.CONFIG, PWD, log });
  return $autoload;

  async function $autoload(injectedName) {
    const resolvedName = SERVICE_NAME_MAP[injectedName] || injectedName;
    const isHandler = /^(head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+/.test(
      resolvedName,
    );
    const modulePath =
      INITIALIZER_PATH_MAP[resolvedName] ||
      path.join(PWD, 'src', isHandler ? 'handlers' : 'services', resolvedName);

    // Here only to be able to statically build dependencies
    if (API && 'API' === resolvedName) {
      return {
        name: resolvedName,
        path: 'internal://' + resolvedName,
        initializer: constant(resolvedName, API),
      };
    }

    /* Architecture Note #4.4: Constants
    First of all the autoloader looks for constants in the
     previously loaded configuration.
    */
    if (CONFIGS[resolvedName]) {
      return {
        name: resolvedName,
        path: 'internal://' + resolvedName,
        initializer: constant(resolvedName, CONFIGS[resolvedName]),
      };
    }

    /* Architecture Note #4.5: Handlers map
    Here, we build the handlers map by injecting every handler required
     by the API.
    */
    if ('HANDLERS' === resolvedName) {
      const handlerNames = [
        ...new Set(
          (await getSwaggerOperations(await flattenSwagger(API))).map(
            operation => operation.operationId,
          ),
        ),
      ];

      return {
        name: resolvedName,
        initializer: initializer(
          {
            name: 'HANDLERS',
            inject: handlerNames,
            type: 'service',
            options: {
              singleton: true,
            },
          },
          async HANDLERS => HANDLERS,
        ),
        path: 'internal://' + resolvedName,
      };
    }

    /* Architecture Note #4.6: Service/handler loading
    Finally, we either require the handler/service module if
     none of the previous strategies applyed.
    */
    const resolvedInitializer = await require(modulePath).default;

    log(
      'debug',
      `Loading ${injectedName} initializer${
        resolvedName !== injectedName ? ` via ${resolvedName} resolution` : ''
      } from ${modulePath}.`,
    );

    return {
      name: resolvedName,
      path: modulePath,
      initializer:
        isHandler && WRAPPERS.length
          ? wrapHandler(resolvedInitializer)
          : resolvedInitializer,
    };
  }
}
