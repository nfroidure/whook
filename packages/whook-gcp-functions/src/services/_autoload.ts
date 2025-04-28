/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
  location,
  type Injector,
  type Autoloader,
  type Initializer,
  type Dependencies,
  type Service,
  type ServiceInitializerWrapper,
} from 'knifecycle';
import { YError } from 'yerror';
import {
  initBuildAutoload,
  initMainHandler,
  noop,
  type WhookOpenAPI,
  type WhookBuildConstantsService,
  type WhookDefinitions,
  type WhookRouteDefinition,
  type WhookRoutesDefinitionsService,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';
import initWrapRouteHandlerForGoogleHTTPFunction from '../wrappers/wrapRouteHandlerForGoogleHTTPFunction.js';

export type GCPFunctionDefinition = {
  name: string;
  type: 'route';
  definition: WhookRouteDefinition;
  openAPI: WhookOpenAPI;
};

export type WhookGoogleFunctionsAutoloadDependencies = {
  BUILD_CONSTANTS?: WhookBuildConstantsService;
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
};

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<Dependencies, Service>>,
  Dependencies
> = (async (
  { $injector, log = noop }: WhookGoogleFunctionsAutoloadDependencies,
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<Initializer<Dependencies, Service>>
> => {
  let API: WhookOpenAPI;
  let DEFINITIONS: WhookDefinitions;
  let ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  const getDefinition = (() => {
    return async (serviceName: string): Promise<GCPFunctionDefinition> => {
      const cleanedName = serviceName.split('_').pop() as string;

      API = API || (await $injector(['API'])).API;
      DEFINITIONS =
        DEFINITIONS || (await $injector(['DEFINITIONS'])).DEFINITIONS;
      ROUTES_DEFINITIONS =
        ROUTES_DEFINITIONS ||
        (await $injector(['ROUTES_DEFINITIONS'])).ROUTES_DEFINITIONS;

      const config = DEFINITIONS.configs[cleanedName as string];

      if (!config) {
        log('error', '💥 - Unable to find a GCP Function definition!');
        throw new YError('E_DEFINITION_NOT_FOUND', serviceName, cleanedName);
      }

      if (!config || config.type !== 'route') {
        log('error', '💥 - GCP Function only supports routes!');
        throw new YError('E_UNSUPPORTED_DEFINITION', serviceName, cleanedName);
      }

      const openAPI = (await cleanupOpenAPI({
        ...API,
        paths: {
          [config.path]: {
            parameters: API?.paths?.[config.path]?.parameters || [],
            [config.method]: API.paths?.[config.path]?.[config.method],
          },
        },
      })) as WhookOpenAPI;

      return {
        name: cleanedName,
        type: 'route',
        openAPI,
        definition:
          ROUTES_DEFINITIONS[cleanedName]?.module?.definition || config,
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
        definition.type === 'route' ? definition.openAPI : {},
      );
    }

    if (serviceName.startsWith('MAIN_DEFINITION_')) {
      const { definition } = await getDefinition(serviceName);

      return constant(serviceName, definition);
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
          initWrapRouteHandlerForGoogleHTTPFunction as any,
        ) as any,
        `@whook/gcp-functions/dist/wrappers/wrapRouteHandlerForGoogleHTTPFunction.js`,
      ) as any;
    }

    if (serviceName.startsWith('MAIN_HANDLER_')) {
      const { type, name, definition } = await getDefinition(serviceName);
      const targetHandler = definition.config?.targetHandler || name;

      return location(
        alsoInject(
          [
            `MAIN_WRAPPER>MAIN_WRAPPER_${serviceName.replace(
              'MAIN_HANDLER_',
              '',
            )}`,
            `?WRAPPERS>${type.toUpperCase()}S_WRAPPERS`,
            `BASE_HANDLER>${targetHandler}`,
          ],
          initMainHandler,
        ) as any,
        '@whook/whook/dist/services/MAIN_HANDLER.js',
      );
    }

    return await $autoload(serviceName);
  };
}) as any;

/**
 * Wrap the _autoload service in order to build for GCP
 *  Functions compatible code.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   [services.BUILD_CONSTANTS]
 * Service whose contents should be considered as constants
 * @param  {Object}   $instance
 * A Knifecycle instance
 * @param  {Object}   $injector
 * The Knifecycle injector
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['?BUILD_CONSTANTS', '$instance', '$injector', '?log'],
  wrapInitializer(initializerWrapper as any, initBuildAutoload),
);
