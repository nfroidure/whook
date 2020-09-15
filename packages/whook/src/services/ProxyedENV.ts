import initEnv from './ENV';
import { wrapInitializer, alsoInject } from 'knifecycle';
import { noop } from '../libs/utils';
import type { LogService } from 'common-services';
import type { ENVService } from './ENV';

export type ProxyedENVConfig = {
  NODE_ENV?: string;
  PROXYED_ENV_VARS?: string[];
};
export type ProxyedENVDependencies = ProxyedENVConfig & {
  NODE_ENV: string;
  log?: LogService;
};

export default alsoInject(
  ['?log', 'NODE_ENV', '?PROXYED_ENV_VARS'],
  // TODO: Better generics in knifecycle ()
  wrapInitializer(wrapEnvForBuild, initEnv),
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
  { log = noop, NODE_ENV, PROXYED_ENV_VARS = [] },
  ENV: ENVService,
) {
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
