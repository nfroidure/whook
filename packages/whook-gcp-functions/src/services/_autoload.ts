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
  type WhookRouteConfig,
  type WhookOpenAPI,
  type WhookBuildConstantsService,
  type WhookRoutesDefinitionsService,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';
import { type WhookAPIOperationGCPFunctionConfig } from '../index.js';
import initWrapHandlerForGoogleHTTPFunction from '../wrappers/wrapRouteHandlerForGoogleHTTPFunction.js';

export type WhookGoogleFunctionsAutoloadDependencies = {
  BUILD_CONSTANTS?: WhookBuildConstantsService;
  $injector: Injector<Service>;
  $instance: Knifecycle;
  log?: LogService;
};

export const GCP_WRAPPERS: Record<
  Required<WhookAPIOperationGCPFunctionConfig>['type'],
  {
    name: string;
    initializer: Initializer<Service, Dependencies>;
  }
> = {
  http: {
    name: 'wrapRouteHandlerForGoogleHTTPFunction',
    initializer: initWrapHandlerForGoogleHTTPFunction as any,
  },
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
  let ROUTES_DEFINITIONS: WhookRoutesDefinitionsService;
  const getAPIDefinition: (
    serviceName: string,
  ) => Promise<[WhookRouteConfig['type'], string, WhookOpenAPI]> = (() => {
    return async (serviceName) => {
      const cleanedName = serviceName.split('_').pop();

      API = API || (await $injector(['API'])).API;
      ROUTES_DEFINITIONS =
        ROUTES_DEFINITIONS ||
        (await $injector(['ROUTES_DEFINITIONS'])).ROUTES_DEFINITIONS;

      const definition =
        ROUTES_DEFINITIONS[cleanedName as string]?.module?.definition;

      if (!definition) {
        log('error', '💥 - Unable to find a lambda operation definition!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName, cleanedName);
      }

      const OPERATION_API = (await cleanupOpenAPI({
        ...API,
        paths: {
          [definition.path]: {
            parameters: API?.paths?.[definition.path]?.parameters || [],
            [definition.method]:
              API.paths?.[definition.path]?.[definition.method],
          },
        },
      })) as WhookOpenAPI;

      return [
        'http',
        definition?.operation?.operationId as string,
        OPERATION_API,
      ];
    };
  })();

  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (serviceName.startsWith('OPERATION_API_')) {
      const [, , OPERATION_API] = await getAPIDefinition(serviceName);

      return constant(serviceName, OPERATION_API);
    }

    if (serviceName.startsWith('OPERATION_WRAPPER_')) {
      const type = (await getAPIDefinition(serviceName))[0] || 'http';

      return location(
        alsoInject(
          [
            `OPERATION_API>${serviceName.replace(
              'OPERATION_WRAPPER_',
              'OPERATION_API_',
            )}`,
          ],
          GCP_WRAPPERS[type].initializer as any,
        ) as any,
        `@whook/gcp-functions/dist/wrappers/${GCP_WRAPPERS[type].name}.js`,
      ) as any;
    }

    if (serviceName.startsWith('OPERATION_HANDLER_')) {
      const [type, operationId] = await getAPIDefinition(serviceName);

      return location(
        alsoInject(
          [
            `MAIN_WRAPPER>OPERATION_WRAPPER_${serviceName.replace(
              'OPERATION_HANDLER_',
              '',
            )}`,
            `?WRAPPERS>${(type || 'http').toUpperCase()}_WRAPPERS`,
            `BASE_HANDLER>${operationId}`,
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
