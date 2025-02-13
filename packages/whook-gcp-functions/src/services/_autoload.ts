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
  noop,
  type WhookAPIHandlerConfig,
  type WhookAPIHandlerDefinition,
  type WhookOpenAPI,
  type WhookBuildConstantsService,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { cleanupOpenAPI } from 'ya-open-api-types';
import { type WhookAPIOperationGCPFunctionConfig } from '../index.js';
import initHandler from './HANDLER.js';
import initWrapHandlerForGoogleHTTPFunction from '../wrappers/wrapHandlerForGoogleHTTPFunction.js';
import { getOpenAPIDefinitions } from '../libs/utils.js';

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
    name: 'wrapHandlerForGoogleHTTPFunction',
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
  let API_DEFINITIONS: WhookAPIHandlerDefinition[];
  const getAPIDefinition: (
    serviceName: string,
  ) => Promise<[WhookAPIHandlerConfig['type'], string, WhookOpenAPI]> = (() => {
    return async (serviceName) => {
      const cleanedName = serviceName.split('_').pop();

      API = API || (await $injector(['API'])).API;

      API_DEFINITIONS = API_DEFINITIONS || getOpenAPIDefinitions(API);

      const definition = API_DEFINITIONS.find(
        (aDefinition) =>
          cleanedName ===
          ((aDefinition?.config?.sourceOperationId &&
            aDefinition?.config?.sourceOperationId) ||
            aDefinition?.operation?.operationId) +
            (aDefinition?.config?.suffix || ''),
      );

      if (!definition) {
        log('error', '💥 - Unable to find a lambda operation definition!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName, cleanedName);
      }

      const OPERATION_API = (await cleanupOpenAPI({
        ...API,
        paths: {
          [definition.path]: {
            [definition.method]:
              API.paths?.[definition.path]?.[definition.method],
          },
        },
      })) as WhookOpenAPI;

      return [
        definition?.config?.type || 'http',
        definition?.operation?.operationId as string,
        {
          ...OPERATION_API,
          paths: {
            [definition.path]: {
              parameters: API[definition.path].parameters || [],
              [definition.method]: definition.operation,
            },
          },
        },
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
            `mainWrapper>OPERATION_WRAPPER_${serviceName.replace(
              'OPERATION_HANDLER_',
              '',
            )}`,
            // Only inject wrappers for HTTP handlers and
            // eventually inject other ones
            ...(type !== 'http'
              ? [`?WRAPPERS>${(type || 'http').toUpperCase()}_WRAPPERS`]
              : []),
            `baseHandler>${operationId}`,
          ],
          initHandler,
        ) as any,
        '@whook/gcp-functions/dist/services/HANDLER.js',
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
