import { initEnv } from 'application-services';
import {
  wrapInitializer,
  alsoInject,
  location,
  type ServiceInitializer,
} from 'knifecycle';
import { noop, type LogService } from 'common-services';
import {
  type AppEnvVars,
  type ProcessEnvDependencies,
} from 'application-services';

export type WhookProxiedENVConfig = {
  PROXIED_ENV_VARS?: string[];
};
export type WhookProxiedENVDependencies = WhookProxiedENVConfig & {
  log?: LogService;
};

export default location(
  alsoInject<
    WhookProxiedENVDependencies,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ProcessEnvDependencies<any>,
    AppEnvVars
  >(
    ['?log', '?PROXIED_ENV_VARS'],
    wrapInitializer(
      wrapEnvForBuild,
      initEnv as ServiceInitializer<WhookProxiedENVDependencies, AppEnvVars>,
    ),
  ),
  import.meta.url,
);

/**
 * Wrap the ENV service in order to filter ENV vars for the build
 * @param  {Object}   services
 * The services ENV depends on
 * @param  {Object}   [services.PROXIED_ENV_VARS={}]
 * A list of environment variable names to proxy
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of an object containing the reshaped env vars.
 */
async function wrapEnvForBuild(
  { log = noop, PROXIED_ENV_VARS = [] }: WhookProxiedENVDependencies,
  ENV: AppEnvVars,
): Promise<AppEnvVars> {
  log('debug', '♻️ -Filtering environment for build.');

  return PROXIED_ENV_VARS.reduce(
    (GATHERED_ENV, name) => ({
      ...GATHERED_ENV,
      [name]: ENV[name] || GATHERED_ENV[name],
    }),
    {
      NODE_ENV: ENV.NODE_ENV,
    },
  );
}
