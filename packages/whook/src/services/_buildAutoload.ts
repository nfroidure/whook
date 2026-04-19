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
  type Dependencies,
  type Service,
  type ServiceInitializer,
  type ServiceInitializerWrapper,
} from 'knifecycle';
import { printStackTrace } from 'yerror';
import { noop, type LogService } from 'common-services';

const initializerWrapper = async (
  {
    $instance,
    log = noop,
  }: {
    $instance: Knifecycle;
    log: LogService;
  },
  $autoload: Autoloader<ServiceInitializer<Dependencies, Service>>,
): Promise<
  (serviceName: string) => Promise<ServiceInitializer<Dependencies, Service>>
> => {
  log('warning', '🤖 - Initializing the `$autoload` build wrapper.');

  return async (
    serviceName,
  ): Promise<ServiceInitializer<Dependencies, Service>> => {
    if (UNBUILDABLE_SERVICES.includes(serviceName)) {
      log(
        'debug',
        `🤷 - Building a project with the "${serviceName}" not buildable service (ie Knifecycle ones: ${UNBUILDABLE_SERVICES.join(
          ', ',
        )}) can give unpredictable results!`,
      );
      return constant<Service>(
        serviceName,
        undefined,
      ) as unknown as ServiceInitializer<Dependencies, Service>;
    }

    try {
      let initializer: ServiceInitializer<Dependencies, Service>;

      try {
        initializer = $instance._getInitializer(
          serviceName,
        ) as ServiceInitializer<Dependencies, Service>;
      } catch (err) {
        log(
          'debug',
          `🤖 - Direct initializer access failure from the Knifecycle instance: "${serviceName}".`,
        );
        log('debug-stack', printStackTrace(err as Error));
      }

      // @ts-expect-error Is fine but TS too stupid to figure out
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
        // @ts-expect-error Is fine but TS too stupid to figure out
        if (initializer && initializer.$location) {
          const reshapedUrl = initializer.$location.url.replace(
            /^(?:.*)\/node_modules\/(.*)$/,
            '$1',
          );

          log(
            'debug',
            `🤖 - Could not auto load "${serviceName}", trying to find it in the initializer embedded location (${reshapedUrl}).`,
          );
          log('debug-stack', printStackTrace(err as Error));

          // Assuming the module name is after the last `node_modules`
          // folder. May not be the best approach
          return location(
            initializer as ServiceInitializer<Dependencies, Service>,
            reshapedUrl,
          );
        }
        throw err;
      }
    } catch (err) {
      log('debug', `🤖 - Unable to load "${serviceName}".`);
      log('debug-stack', printStackTrace(err as Error));
      throw err;
    }
  };
};

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
    wrapInitializer<Dependencies, Service>(
      initializerWrapper as ServiceInitializerWrapper<Service, Dependencies>,
      initAutoload as ServiceInitializer<Dependencies, Service>,
    ),
  ),
  import.meta.url,
);
