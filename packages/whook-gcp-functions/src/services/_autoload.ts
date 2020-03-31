import { initAutoload, noop } from '@whook/whook';
import {
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import YError from 'yerror';
import { flattenOpenAPI, getOpenAPIOperations } from '@whook/http-router';
import type Knifecycle from 'knifecycle';
import type { Injector } from 'knifecycle';
import type { WhookBuildConstantsService } from '@whook/whook';
import type { LogService } from 'common-services';

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
        $injector: Injector<any>;
        $instance: Knifecycle;
        log: LogService;
      },
      $autoload,
    ) => {
      let API_OPERATIONS;
      const getAPIOperations = (() => {
        return async () => {
          // eslint-disable-next-line
          API_OPERATIONS =
            API_OPERATIONS ||
            (await getOpenAPIOperations(
              await flattenOpenAPI((await $injector(['API'])).API),
            ));
          return API_OPERATIONS;
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

          if (serviceName.startsWith('OPERATION_')) {
            const OPERATION = (await getAPIOperations()).find(
              (operation) =>
                serviceName ===
                (((operation['x-whook'] || {}).sourceOperationId &&
                  'OPERATION_' +
                    (operation['x-whook'] || {}).sourceOperationId) ||
                  'OPERATION_' + operation.operationId) +
                  ((operation['x-whook'] || {}).suffix || ''),
            );

            if (!OPERATION) {
              log(
                'error',
                '💥 - Unable to find a lambda operation definition!',
              );
              throw new YError('E_OPERATION_NOT_FOUND', serviceName);
            }

            return {
              initializer: constant(serviceName, OPERATION),
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
