/* eslint-disable @typescript-eslint/no-explicit-any */
import initAutoload from './_autoload.js';
import { noop } from '../libs/utils.js';
import {
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import type { WhookBuildConstantsService } from '../index.js';
import type {
  Knifecycle,
  Autoloader,
  Initializer,
  Dependencies,
  Service,
  ServiceInitializerWrapper,
} from 'knifecycle';
import { printStackTrace } from 'yerror';
import type { LogService } from 'common-services';

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<Dependencies, Service>>,
  Dependencies
> = (async (
  {
    BUILD_CONSTANTS = {},
    $instance,
    log = noop,
  }: {
    BUILD_CONSTANTS?: WhookBuildConstantsService;
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
  log('debug', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (['$instance', '$inject', '$fatalError'].includes(serviceName)) {
      return {
        initializer: constant(serviceName, undefined),
        path: `constant://${serviceName}`,
      };
    }

    if (serviceName === 'HANDLERS') {
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
  wrapInitializer(initializerWrapper as any, initAutoload),
);
