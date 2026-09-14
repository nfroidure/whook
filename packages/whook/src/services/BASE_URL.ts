import { autoService, location, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { YError } from 'yerror';

/* Architecture Note #2.1: Base URL
The `BASE_URL` service is intended to provide a base URL where
 the API can be found at. It can be overridden directly via
 injecting it but it is useful to have a usable URL while
 debugging production environnement.
*/

export type WhookBaseURL = string;
export type WhookBasePath = '' | `/${string}`;

export interface WhookConfig {
  name: string;
  description?: string;
  baseURL?: WhookBaseURL;
  basePath?: WhookBasePath;
}

export interface WhookBaseURLEnv {
  DEV_MODE?: string;
  PUBLIC_URL?: string;
}
export interface WhookBaseURLConfig {
  CONFIG: WhookConfig;
  PROTOCOL?: string;
  HOST?: string;
  PORT?: number;
}
export type WhookBaseURLDependencies = WhookBaseURLConfig & {
  ENV: WhookBaseURLEnv;
  HOST: string;
  PORT: number;
  log?: LogService;
};

/**
 * Initialize the BASE_URL service according to the HOST/PORT
 *  so that applications fallbacks to that default base URL.
 * @param  {Object}   services
 * The service dependencies
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
 * @param  {Function}   [services.log=noop]
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
    ENV.PUBLIC_URL ||
    (CONFIG.baseURL && !ENV.DEV_MODE
      ? CONFIG.baseURL
      : `${PROTOCOL}://${HOST}${PORT ? `:${PORT}` : ''}`);

  log('debug', `🈁 - Generated the BASE_URL constant "${BASE_URL}".`);

  try {
    new URL(BASE_URL);
  } catch (err) {
    throw YError.wrap(err as Error, 'E_BAD_BASE_URL', [BASE_URL]);
  }

  return BASE_URL;
}

export default location(
  name('BASE_URL', autoService(initBaseURL)),
  import.meta.url,
);
