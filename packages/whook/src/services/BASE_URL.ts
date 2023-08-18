import { autoService, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { LogService } from 'common-services';

/* Architecture Note #4: Base URL
The `BASE_URL` service is intended to provide a base URL where
 the API can be found at. It can be overriden directly via
 injecting it but it is useful to have a usable URL while
 debugging production environnement.
*/

export type WhookConfig = {
  name: string;
  description?: string;
  baseURL?: string;
};

export type WhookBaseURL = string;
export type WhookBaseURLEnv = {
  DEV_MODE?: string;
};
export type WhookBaseURLConfig = {
  CONFIG: WhookConfig;
  PROTOCOL?: string;
  HOST?: string;
  PORT?: number;
};
export type WhookBaseURLDependencies = WhookBaseURLConfig & {
  ENV: WhookBaseURLEnv;
  HOST: string;
  PORT: number;
  log?: LogService;
};

export default name('BASE_URL', autoService(initBaseURL));

/**
 * Initialize the BASE_URL service according to the HOST/PORT
 *  so that applications fallbacks to that default base URL.
 * @param  {Object}   services
 * The services BASE_URL depends on
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.CONFIG
 * The injected CONFIG value
 * @param  {Object}   [services.PROTOCOL]
 * The injected PROTOCOL value
 * @param  {Object}   services.HOST
 * The injected HOST value
 * @param  {Object}   services.PORT
 * The injected PORT value
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initBaseURL({
  ENV,
  CONFIG,
  PROTOCOL = 'http',
  HOST,
  PORT,
  log = noop,
}: WhookBaseURLDependencies): Promise<WhookBaseURL> {
  const BASE_URL =
    CONFIG.baseURL && !ENV.DEV_MODE
      ? CONFIG.baseURL
      : `${PROTOCOL}://${HOST}${PORT ? `:${PORT}` : ''}`;

  log('debug', `🈁 - Generated the BASE_URL constant "${BASE_URL}".`);

  return BASE_URL;
}
