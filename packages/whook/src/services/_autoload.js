import { identity, noop, compose } from '../libs/utils';
import { initializer, constant, name } from 'knifecycle';
import {
  flattenOpenAPI,
  getOpenAPIOperations,
} from '@whook/http-router/dist/utils';
import path from 'path';

// Needed to avoid messing up babel builds 🤷
const _require = require;

/* Architecture Note #5: `$autoload` service
The default Whook autoloader provides a simple way to
 load the constants, services and handlers of a Whook
 project.
*/
export default initializer(
  {
    name: '$autoload',
    type: 'service',
    inject: [
      'NODE_ENV',
      'PWD',
      'PROJECT_SRC',
      '$injector',
      '?SERVICE_NAME_MAP',
      '?INITIALIZER_PATH_MAP',
      '?WRAPPERS',
      '?log',
    ],
    options: { singleton: true },
  },
  initAutoload,
);

/**
 * Initialize the Whook default DI autoloader
 * @param  {Object}   services
 * The services `$autoload` depends on
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   services.$injector
 * An injector for internal dynamic services loading
 * @param  {Object}   [services.SERVICE_NAME_MAP={}]
 * An optional object to map services names to other names
 * @param  {Object}   [services.INITIALIZER_PATH_MAP={}]
 * An optional object to map non-autoloadable initializers
 * @param  {Array}   [services.WRAPPERS]
 * An optional list of wrappers to inject
 * @param  {Array}   [services.CONFIGS]
 * Optional CONFIGS object to inject
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Function>}
 * A promise of the autoload function.
 */
async function initAutoload({
  PROJECT_SRC,
  $injector,
  SERVICE_NAME_MAP = {},
  INITIALIZER_PATH_MAP = {},
  WRAPPERS,
  CONFIGS,
  log = noop,
  require = _require,
}) {
  log('debug', '🤖 - Initializing the `$autoload` service.');

  /* Architecture Note #5.3: API auto loading
  We cannot inject the `API` in the auto loader since
    it is dynamically loaded so doing during the auto loader
    initialization.
  */
  let API;
  const getAPI = (() => {
    return async () => {
      API = API || (await $injector(['API'])).API;
      return API;
    };
  })();

  /* Architecture Note #5.2: Wrappers auto loading support
  We cannot inject the `WRAPPERS` in the auto loader when
   it is dynamically loaded so giving a second chance here
   for `WRAPPERS` to be set.
  */
  const doWrapHandler = (WRAPPERS => {
    let wrapHandler;

    return async handlerInitializer => {
      WRAPPERS = WRAPPERS || (await $injector(['WRAPPERS'])).WRAPPERS || [];
      wrapHandler =
        wrapHandler || (WRAPPERS.length ? compose(...WRAPPERS) : identity);

      return wrapHandler(handlerInitializer);
    };
  })(WRAPPERS);

  return $autoload;

  /**
   * Autoload an initializer from its name
   * @param  {String}  The dependency name
   * @return {Promise<Object>}
   * A promise resolving whith the actual autoloader definition.
   *  An Object containing the `path`, `name` and the `initializer`
   *  in its properties.
   */
  async function $autoload(injectedName) {
    const resolvedName = SERVICE_NAME_MAP[injectedName] || injectedName;

    /* Architecture Note #5.1: Configuration auto loading
    Loading the configuration files is done according to the `NODE_ENV`
     environment variable. It basically requires a configuration hash
     where the keys are Knifecycle constants.

    Let's load the configuration files as a convenient way
     to create constants on the fly
    */
    if ('CONFIGS' !== resolvedName) {
      CONFIGS = CONFIGS || (await $injector(['CONFIGS'])).CONFIGS;
    }

    /* Architecture Note #5.4: Constants
    First of all the autoloader looks for constants in the
     previously loaded configuration.
    */
    if (CONFIGS && CONFIGS[resolvedName]) {
      return {
        name: resolvedName,
        path: 'internal://' + resolvedName,
        initializer: constant(resolvedName, CONFIGS[resolvedName]),
      };
    }

    const isHandler = /^(head|get|put|post|delete|options|handle)[A-Z][a-zA-Z0-9]+/.test(
      resolvedName,
    );
    const isWrappedHandler = resolvedName.endsWith('Wrapped');
    const modulePath =
      INITIALIZER_PATH_MAP[resolvedName] ||
      path.join(
        PROJECT_SRC,
        isHandler ? 'handlers' : 'services',
        isWrappedHandler ? resolvedName.replace(/Wrapped$/, '') : resolvedName,
      );

    /* Architecture Note #5.5: Handlers map
    Here, we build the handlers map by injecting every handler required
     by the API.
    */
    if ('HANDLERS' === resolvedName) {
      const handlerNames = [
        ...new Set(
          (await getOpenAPIOperations(
            await flattenOpenAPI(await getAPI()),
          )).map(operation => operation.operationId),
        ),
      ].map(handlerName => `${handlerName}>${handlerName}Wrapped`);

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

    /* Architecture Note #5.6: Service/handler loading
    Finally, we either require the handler/service module if
     none of the previous strategies applyed.
    */
    const resolvedInitializer = await require(modulePath).default;

    log(
      'debug',
      `💿 - Loading ${injectedName} initializer${
        resolvedName !== injectedName ? ` via ${resolvedName} resolution` : ''
      } from ${modulePath}.`,
    );

    return {
      name: resolvedName,
      path: modulePath,
      initializer: isWrappedHandler
        ? name(resolvedName, await doWrapHandler(resolvedInitializer))
        : resolvedInitializer,
    };
  }
}
