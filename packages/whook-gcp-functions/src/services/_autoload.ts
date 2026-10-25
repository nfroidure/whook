import {
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
  location,
  type Injector,
  type Autoloader,
  type Initializer,
  type Service,
  type ServiceInitializerWrapper,
} from 'knifecycle';
import { YError } from 'yerror';
import {
  initMainHandler,
  noop,
  type WhookOpenAPI,
  type WhookDefinitions,
  type WhookRouteDefinition,
  type WhookMainDefinition,
} from '@whook/whook';
import { initBuildAutoload } from '@whook/dev';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';
import initWrapRouteHandlerForGoogleHTTPFunction from '../wrappers/wrapRouteHandlerForGoogleHTTPFunction.js';

export type GCPFunctionDefinition = {
  name: string;
} & {
  definition: WhookRouteDefinition & {
    type: 'route';
    url: `file:///${string}`;
  };
  openAPI: WhookOpenAPI;
};

export interface WhookGoogleFunctionsAutoloadDependencies {
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
}

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<unknown, Service>>,
  WhookGoogleFunctionsAutoloadDependencies
> = async (
  { $injector, log = noop }: WhookGoogleFunctionsAutoloadDependencies,
  $autoload: Autoloader<Initializer<unknown, Service>>,
): Promise<Autoloader<Initializer<unknown, Service>>> => {
  let API: WhookOpenAPI;
  let DEFINITIONS: WhookDefinitions;
  const getDefinition = (() => {
    return async (serviceName: string): Promise<GCPFunctionDefinition> => {
      const cleanedName = serviceName.split('_').pop() as string;

      API = API || (await $injector(['API'])).API;
      DEFINITIONS =
        DEFINITIONS || (await $injector(['DEFINITIONS'])).DEFINITIONS;

      const config = DEFINITIONS.configs[cleanedName as string];

      if (!config) {
        log('error', '💥 - Unable to find a GCP Function definition!');
        throw new YError('E_DEFINITION_NOT_FOUND', [serviceName, cleanedName]);
      }

      if (!config || config.type !== 'route') {
        log('error', '💥 - GCP Function only supports routes!');
        throw new YError('E_UNSUPPORTED_DEFINITION', [
          serviceName,
          cleanedName,
        ]);
      }

      const openAPI = await cleanupOpenAPI({
        ...API,
        paths: {
          [config.path]: {
            parameters: API?.paths?.[config.path]?.parameters || [],
            [config.method]: API.paths?.[config.path]?.[config.method],
          },
        },
      } as WhookOpenAPI);

      return {
        name: cleanedName,
        openAPI,
        definition: config,
      };
    };
  })();

  log(
    'debug',
    '🤖 - Initializing the GCP Functions `$autoload` build wrapper.',
  );

  return async (serviceName) => {
    if (serviceName.startsWith('MAIN_API_')) {
      const definition = await getDefinition(serviceName);

      return constant(
        serviceName,
        'openAPI' in definition ? definition.openAPI : {},
      );
    }

    if (serviceName.startsWith('MAIN_DEFINITION_')) {
      const { definition } = await getDefinition(serviceName);

      return constant(serviceName, definition satisfies WhookMainDefinition);
    }

    if (serviceName.startsWith('MAIN_WRAPPER_')) {
      return location(
        alsoInject(
          [
            `MAIN_DEFINITION>${serviceName.replace(
              'MAIN_WRAPPER_',
              'MAIN_DEFINITION_',
            )}`,
            `MAIN_API>${serviceName.replace('MAIN_WRAPPER_', 'MAIN_API_')}`,
          ],
          initWrapRouteHandlerForGoogleHTTPFunction,
        ),
        `@whook/gcp-functions/dist/wrappers/wrapRouteHandlerForGoogleHTTPFunction.js`,
      );
    }

    if (serviceName.startsWith('MAIN_HANDLER_')) {
      const { name, definition } = await getDefinition(serviceName);
      const targetHandler = definition.config?.targetHandler || name;

      return location(
        alsoInject(
          [
            `MAIN_DEFINITION>MAIN_DEFINITION_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            `MAIN_WRAPPER>MAIN_WRAPPER_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            `MAIN_WRAPPERS>${definition.type.toUpperCase()}S_WRAPPERS`,
            `?MAIN_WRAPPERS_ORDER>${definition.type.toUpperCase()}S_WRAPPERS_ORDER`,
            `BASE_HANDLER>${targetHandler}`,
          ],
          initMainHandler,
        ),
        '@whook/whook/dist/services/MAIN_HANDLER.js',
      );
    }

    return await $autoload(serviceName);
  };
};

/**
 * Wrap the _autoload service in order to build for GCP
 *  Functions compatible code.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   $instance
 * A Knifecycle instance
 * @param  {Object}   $injector
 * The Knifecycle injector
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['$instance', '$injector', '?log'],
  wrapInitializer(initializerWrapper, initBuildAutoload),
);
