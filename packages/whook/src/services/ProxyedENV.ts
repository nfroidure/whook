import { initEnvService } from 'application-services';
import { wrapInitializer, alsoInject } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { LogService } from 'common-services';
import type { AppEnvVars, ENVDependencies } from 'application-services';
import type { ServiceInitializer } from 'knifecycle';

export type ProxyedENVConfig = {
  NODE_ENV?: string;
  PROXYED_ENV_VARS?: string[];
};
export type ProxyedENVDependencies = ProxyedENVConfig & {
  NODE_ENV: string;
  log?: LogService;
};

export default alsoInject<
  ProxyedENVDependencies,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ENVDependencies<any>,
  AppEnvVars
>(
  ['?log', 'NODE_ENV', '?PROXYED_ENV_VARS'],
  wrapInitializer(
    wrapEnvForBuild,
    initEnvService as ServiceInitializer<ProxyedENVDependencies, AppEnvVars>,
  ),
);

/**
 * Wrap the ENV service in order to filter ENV vars for the build
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
async function wrapEnvForBuild(
  { log = noop, NODE_ENV, PROXYED_ENV_VARS = [] }: ProxyedENVDependencies,
  ENV: AppEnvVars,
): Promise<AppEnvVars> {
  log('debug', '♻️ -Filtering environment for build.');

  return PROXYED_ENV_VARS.reduce(
    (GATHERED_ENV, name) => ({
      ...GATHERED_ENV,
      [name]: ENV[name] || GATHERED_ENV[name],
    }),
    {
      NODE_ENV,
    },
  );
}
