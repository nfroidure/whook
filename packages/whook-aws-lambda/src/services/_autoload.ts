/* eslint-disable @typescript-eslint/no-explicit-any */
import { initAutoload, noop, cleanupOpenAPI } from '@whook/whook';
import {
  Knifecycle,
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import type { WhookBuildConstantsService } from '@whook/whook';
import type { WhookRawOperation } from '@whook/http-router';
import type {
  Injector,
  Autoloader,
  Initializer,
  Dependencies,
  Service,
  ServiceInitializerWrapper,
} from 'knifecycle';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import type { WhookAPIOperationAWSLambdaConfig } from '../index.js';

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<Dependencies, Service>>,
  Dependencies
> = (async (
  {
    BUILD_CONSTANTS = {},
    $injector,
    $instance,
    log = noop,
  }: {
    BUILD_CONSTANTS?: WhookBuildConstantsService;
    $injector: Injector<Service>;
    $instance: Knifecycle;
    log: LogService;
  },
  $autoload: Autoloader<Initializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<{
    initializer: Initializer<Dependencies, Service>;
    path: string;
  }>
> => {
  let API: OpenAPIV3.Document;
  let OPERATION_APIS: WhookRawOperation<WhookAPIOperationAWSLambdaConfig>[];
  const getAPIOperation = (() => {
    return async (serviceName) => {
      // eslint-disable-next-line
      API = API || (await $injector(['API'])).API;

      // eslint-disable-next-line
      OPERATION_APIS =
        OPERATION_APIS ||
        getOpenAPIOperations<WhookAPIOperationAWSLambdaConfig>(API);

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
      const OPERATION_API = cleanupOpenAPI({
        ...API,
        paths: {
          [OPERATION.path]: {
            [OPERATION.method]: API.paths[OPERATION.path]?.[OPERATION.method],
          },
        },
      });

      return {
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
      };
    };
  })();

  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    try {
      // TODO: add initializer map to knifecycle public API
      const initializer = ($instance as any)._initializers.get(serviceName);

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
        const OPERATION_API = await getAPIOperation(serviceName);

        return {
          initializer: constant(serviceName, OPERATION_API),
          path: `api://${serviceName}`,
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
      log('error', `Build error while loading "${serviceName}".`);
      log('error-stack', printStackTrace(err as Error));
      throw err;
    }
  };
}) as any;

/**
 * Wrap the _autoload service in order to build AWS
 *  Lambda compatible code.
 * @param  {Object}   services
 * The services the autoloader depends on
 * @param  {Object}   [services.BUILD_CONSTANTS]
 * The injected BUILD_CONSTANTS value to add it to the build env
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['?BUILD_CONSTANTS', '$instance', '$injector', '?log'],
  wrapInitializer(initializerWrapper as any, initAutoload),
);
