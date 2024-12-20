/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  UNBUILDABLE_SERVICES,
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
  cleanupOpenAPI,
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
  type WhookBuildConstantsService,
  type WhookRawOperation,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { type OpenAPIV3_1 } from 'openapi-types';
import { type WhookAPIOperationGCPFunctionConfig } from '../index.js';
import initHandler from './HANDLER.js';
import initWrapHandlerForGoogleHTTPFunction from '../wrappers/wrapHandlerForGoogleHTTPFunction.js';

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
  let API: OpenAPIV3_1.Document;
  let OPERATION_APIS: WhookRawOperation<WhookAPIOperationGCPFunctionConfig>[];
  const getAPIOperation: (
    serviceName: string,
  ) => Promise<
    [
      Required<WhookAPIOperationGCPFunctionConfig>['type'],
      string,
      OpenAPIV3_1.Document,
    ]
  > = (() => {
    return async (serviceName) => {
      const cleanedName = serviceName.split('_').pop();

      API = API || (await $injector(['API'])).API;
      OPERATION_APIS =
        OPERATION_APIS ||
        getOpenAPIOperations<WhookAPIOperationGCPFunctionConfig>(API);

      const OPERATION = OPERATION_APIS.find(
        (operation) =>
          cleanedName ===
          (((operation['x-whook'] || {}).sourceOperationId &&
            (operation['x-whook'] || {}).sourceOperationId) ||
            operation.operationId) +
            ((operation['x-whook'] || {}).suffix || ''),
      );

      if (!OPERATION) {
        log('error', '💥 - Unable to find a function operation definition!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName);
      }

      const OPERATION_API: OpenAPIV3_1.Document = cleanupOpenAPI({
        ...API,
        paths: {
          [OPERATION.path]: {
            [OPERATION.method]: API.paths?.[OPERATION.path]?.[OPERATION.method],
          },
        },
      });

      return [
        OPERATION['x-whook']?.type || 'http',
        OPERATION.operationId as string,
        {
          ...OPERATION_API,
          paths: {
            [OPERATION.path]: {
              [OPERATION.method]: (
                await dereferenceOpenAPIOperations(OPERATION_API, [
                  {
                    path: OPERATION.path,
                    method: OPERATION.method,
                    ...OPERATION_API.paths?.[OPERATION.path]?.[
                      OPERATION.method
                    ],
                    parameters: OPERATION.parameters,
                  },
                ])
              )[0],
            },
          },
        },
      ];
    };
  })();

  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (UNBUILDABLE_SERVICES.includes(serviceName)) {
      log(
        'warning',
        `🤷 - Building a project with the "${serviceName}" unbuildable service (ie Knifecycle ones: ${UNBUILDABLE_SERVICES.join(
          ', ',
        )}) can give unpredictable results!`,
      );
      return constant(serviceName, undefined);
    }

    if (serviceName.startsWith('OPERATION_API_')) {
      const [, , OPERATION_API] = await getAPIOperation(serviceName);

      return constant(serviceName, OPERATION_API);
    }

    if (serviceName.startsWith('OPERATION_WRAPPER_')) {
      const [type] = await getAPIOperation(serviceName);

      return location(
        alsoInject(
          [
            `OPERATION_API>${serviceName.replace(
              'OPERATION_WRAPPER_',
              'OPERATION_API_',
            )}`,
          ],
          GCP_WRAPPERS[type].initializer as any,
        ),
        `@whook/gcp-functions/dist/wrappers/${GCP_WRAPPERS[type].name}.js`,
      ) as any;
    }

    if (serviceName.startsWith('OPERATION_HANDLER_')) {
      const [, operationId] = await getAPIOperation(serviceName);

      return location(
        alsoInject(
          [
            `mainWrapper>OPERATION_WRAPPER_${serviceName.replace(
              'OPERATION_HANDLER_',
              '',
            )}`,
            `baseHandler>${operationId}`,
          ],
          initHandler,
        ),
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
