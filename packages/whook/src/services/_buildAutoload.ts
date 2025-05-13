/* eslint-disable @typescript-eslint/no-explicit-any */
import initAutoload from './_autoload.js';
import {
  UNBUILDABLE_SERVICES,
  SPECIAL_PROPS,
  wrapInitializer,
  constant,
  alsoInject,
  location,
  type Knifecycle,
  type Autoloader,
  type Initializer,
  type Dependencies,
  type Service,
  type ServiceInitializerWrapper,
} from 'knifecycle';
import { printStackTrace } from 'yerror';
import { noop, type LogService } from 'common-services';

const initializerWrapper: ServiceInitializerWrapper<
  Autoloader<Initializer<Dependencies, Service>>,
  Dependencies
> = (async (
  {
    $instance,
    log = noop,
  }: {
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
  log('warning', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (serviceName) => {
    if (UNBUILDABLE_SERVICES.includes(serviceName)) {
      log(
        'warning',
        `🤷 - Building a project with the "${serviceName}" not buildable service (ie Knifecycle ones: ${UNBUILDABLE_SERVICES.join(
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

      try {
        return await $autoload(serviceName);
      } catch (err) {
        if (initializer && initializer[SPECIAL_PROPS.LOCATION]) {
          const reshapedUrl = initializer[SPECIAL_PROPS.LOCATION].url.replace(
            /^(?:.*)\/node_modules\/(.*)$/,
            '$1',
          );

          log(
            'error',
            `🤖 - Could not auto load "${serviceName}", trying to find it in the initializer embedded location (${reshapedUrl}).`,
          );
          log('debug-stack', printStackTrace(err as Error));

          // Assuming the module name is after the last `node_modules`
          // folder. May not be the best approach
          return location(initializer, reshapedUrl);
        }
        throw err;
      }
    } catch (err) {
      log('debug', `🤖 - Unable to load "${serviceName}".`);
      log('debug-stack', printStackTrace(err as Error));
      throw err;
    }
  };
}) as any;

/**
 * Wrap the _autoload service in order to build AWS
 *  Lambda compatible code.
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   $instance
 * A Knifecycle instance
 * @param  {Object}   $injector
 * The Knifecycle injector
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
export default location(
  alsoInject(
    ['$instance', '$injector', '?log'],
    wrapInitializer(initializerWrapper as any, initAutoload),
  ),
  import.meta.url,
);
