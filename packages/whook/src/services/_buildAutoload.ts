/* eslint-disable @typescript-eslint/no-explicit-any */
import initAutoload from './_autoload.js';
import { noop } from '../libs/utils.js';
import {
  UNBUILDABLE_SERVICES,
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
} from 'knifecycle';
import type { WhookBuildConstantsService } from '../services/BUILD_CONSTANTS.js';
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
    if (UNBUILDABLE_SERVICES.includes(serviceName)) {
      log(
        'warning',
        `🤷 - Building a project with the "${serviceName}" unbuildable service (ie Knifecycle ones: ${UNBUILDABLE_SERVICES.join(
          ', ',
        )}) can give unpredictable results!`,
      );
      return constant(serviceName, undefined);
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
        return initializer;
      }

      if (BUILD_CONSTANTS[serviceName]) {
        return constant(serviceName, BUILD_CONSTANTS[serviceName]);
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
 * @param  {Object}   [services.BUILD_CONSTANTS]
 * The injected BUILD_CONSTANTS value to add it to the build env
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
  wrapInitializer(initializerWrapper as any, initAutoload),
);
