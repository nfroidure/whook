/* eslint-disable @typescript-eslint/no-explicit-any */
import { initAutoload, noop, cleanupOpenAPI } from '@whook/whook';
import {
  SPECIAL_PROPS,
  UNBUILDABLE_SERVICES,
  Knifecycle,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import initHandler from './HANDLER.js';
import initWrapHandlerForGoogleHTTPFunction from '../wrappers/wrapHandlerForGoogleHTTPFunction.js';
import type {
  Injector,
  Autoloader,
  Initializer,
  Dependencies,
  Service,
  ServiceInitializerWrapper,
} from 'knifecycle';
import type { WhookBuildConstantsService } from '@whook/whook';
import type { WhookRawOperation } from '@whook/http-router';
import type { LogService, ResolveService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookAPIOperationGCPFunctionConfig } from '../index.js';

export type WhookGoogleFunctionsAutoloadDependencies = {
  BUILD_CONSTANTS?: WhookBuildConstantsService;
  $injector: Injector<Service>;
  $instance: Knifecycle;
  resolve: ResolveService;
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
  {
    BUILD_CONSTANTS = {},
    $injector,
    $instance,
    resolve,
    log = noop,
  }: WhookGoogleFunctionsAutoloadDependencies,
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<{
    initializer: Initializer<Dependencies, Service>;
    path: string;
  }>
> => {
  let API: OpenAPIV3.Document;
  let OPERATION_APIS: WhookRawOperation<WhookAPIOperationGCPFunctionConfig>[];
  const getAPIOperation: (
    serviceName: string,
  ) => Promise<
    [
      Required<WhookAPIOperationGCPFunctionConfig>['type'],
      string,
      OpenAPIV3.Document,
    ]
  > = (() => {
    return async (serviceName) => {
      // eslint-disable-next-line
      API = API || (await $injector(['API'])).API;
      // eslint-disable-next-line
      OPERATION_APIS =
        OPERATION_APIS ||
        getOpenAPIOperations<WhookAPIOperationGCPFunctionConfig>(API);

      const OPERATION = OPERATION_APIS.find(
        (operation) =>
          serviceName ===
          (((operation['x-whook'] || {}).sourceOperationId &&
            'OPERATION_API_' +
              (operation['x-whook'] || {}).sourceOperationId) ||
            'OPERATION_API_' + operation.operationId) +
            ((operation['x-whook'] || {}).suffix || ''),
      );

      if (!OPERATION) {
        log('error', '💥 - Unable to find a lambda operation definition!');
        throw new YError('E_OPERATION_NOT_FOUND', serviceName);
      }

      // eslint-disable-next-line
      const OPERATION_API: OpenAPIV3.Document = cleanupOpenAPI({
        ...API,
        paths: {
          [OPERATION.path]: {
            [OPERATION.method]: API.paths[OPERATION.path]?.[OPERATION.method],
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
                    ...OPERATION_API.paths[OPERATION.path]?.[OPERATION.method],
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
      return {
        initializer: constant(serviceName, undefined),
        path: `constant://${serviceName}`,
      };
    }

    try {
      let initializer;

      try {
        initializer = $instance._getInitializer(serviceName);
      } catch (err) {
        log(
          'debug',
          `🤖 - Direct initializer access failure from the Knifecycle instance: "${serviceName}".`,
        );
        log('debug-stack', printStackTrace(err as Error));
      }

      if (initializer && initializer[SPECIAL_PROPS.TYPE] === 'constant') {
        log(
          'debug',
          `🤖 - Reusing a constant initializer directly from the Knifecycle instance: "${serviceName}".`,
        );
        return {
          initializer,
          path: `instance://${serviceName}`,
        };
      }

      if (serviceName.startsWith('OPERATION_API_')) {
        const [, , OPERATION_API] = await getAPIOperation(serviceName);

        return {
          initializer: constant(serviceName, OPERATION_API),
          path: `api://${serviceName}`,
        };
      }

      if (serviceName.startsWith('OPERATION_WRAPPER_')) {
        const [type] = await getAPIOperation(serviceName);

        return {
          initializer: alsoInject(
            [
              `OPERATION_API>${serviceName.replace(
                'OPERATION_WRAPPER_',
                'OPERATION_API_',
              )}`,
            ],
            GCP_WRAPPERS[type].initializer as any,
          ) as any,
          path: resolve(
            `@whook/gcp-functions/dist/wrappers/${GCP_WRAPPERS[type].name}`,
          ),
        };
      }

      if (serviceName.startsWith('OPERATION_HANDLER_')) {
        const [, operationId] = await getAPIOperation(serviceName);

        return {
          name: serviceName,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          initializer: alsoInject(
            [
              `mainWrapper>OPERATION_WRAPPER_${serviceName.replace(
                'OPERATION_HANDLER_',
                '',
              )}`,
              `baseHandler>${operationId}`,
            ],
            initHandler,
          ) as any,
          path: resolve('@whook/gcp-functions/dist/services/HANDLER'),
        };
      }

      if (BUILD_CONSTANTS[serviceName]) {
        return {
          initializer: constant(serviceName, BUILD_CONSTANTS[serviceName]),
          path: `constant://${serviceName}`,
        };
      }

      return $autoload(serviceName);
    } catch (err) {
      log('error', `💥 - Build error while loading "${serviceName}".`);
      log('error-stack', printStackTrace(err as Error));
      throw err;
    }
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapInitializer(initializerWrapper as any, initAutoload),
);
