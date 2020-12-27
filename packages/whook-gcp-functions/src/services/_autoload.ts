import { initAutoload, noop, WhookOperation } from '@whook/whook';
import {
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import YError from 'yerror';
import {
  dereferenceOpenAPIOperations,
  getOpenAPIOperations,
} from '@whook/http-router';
import type { Knifecycle, Dependencies, Service } from 'knifecycle';
import type { Injector } from 'knifecycle';
import type { WhookBuildConstantsService } from '@whook/whook';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';
import { WhookAPIOperationGCPFunctionConfig } from '..';

/**
 * Wrap the _autoload service in order to build AWS
 *  Lambda compatible code.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value to add it to the build env
 * @param  {Object}   [services.PROXYED_ENV_VARS={}]
 * A list of environment variable names to proxy
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default alsoInject(
  ['?BUILD_CONSTANTS', '$instance', '$injector', '?log'],
  wrapInitializer(
    async (
      {
        BUILD_CONSTANTS = {},
        $injector,
        $instance,
        log = noop,
      }: {
        BUILD_CONSTANTS?: WhookBuildConstantsService;
        $injector: Injector<Service>;
        $instance: Knifecycle<Dependencies>;
        log: LogService;
      },
      $autoload,
    ) => {
      let API: OpenAPIV3.Document;
      let OPERATION_APIS: WhookOperation<WhookAPIOperationGCPFunctionConfig>[];
      const getAPIOperation = (() => {
        return async (serviceName) => {
          // eslint-disable-next-line
          API = API || (await $injector(['API'])).API;
          // eslint-disable-next-line
          OPERATION_APIS =
            OPERATION_APIS ||
            (await dereferenceOpenAPIOperations(
              API,
              getOpenAPIOperations<WhookAPIOperationGCPFunctionConfig>(API),
            ));

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

          // TODO: Do a better cleanup of all unuseful resources
          return {
            ...API,
            paths: {
              [OPERATION.path]: {
                [OPERATION.method]: OPERATION,
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
              '🤖 - Reusing a constant initializer directly from the Knifecycle instance:',
              serviceName,
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
          log('error', `Build error while loading ${serviceName}  `);
          log('stack', err.stack);
        }
      };
    },
    initAutoload,
  ),
);
