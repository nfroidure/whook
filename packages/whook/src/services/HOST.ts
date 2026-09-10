import { inject, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';

const DEFAULT_ENV = {};

/* Architecture Note #2.2: Host detection
If no `HOST` configuration is specified in dependencies nor in ENV,
 this service uses the injected host value.
*/

export default location(
  name('HOST', inject(['?ENV', '?log', 'HOST>INTERNAL_IP'], initHost)),
  import.meta.url,
);

export type WhookHost = string;
export interface WhookHostEnv {
  HOST?: WhookHost;
  CONTAINERIZED?: string;
  DEV_MODE?: string;
}

/**
 * Initialize the HOST service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.HOST
 * A service allowing to determine the default host
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initHost({
  ENV = DEFAULT_ENV,
  log = noop,
  HOST,
}: {
  ENV?: WhookHostEnv;
  log?: LogService;
  HOST: WhookHost;
}): Promise<WhookHost> {
  log('debug', `🏭 - Initializing the HOST service.`);

  if ('undefined' !== typeof ENV.HOST) {
    log('warning', `♻️ - Using ENV host "${ENV.HOST}"`);
    return ENV.HOST;
  }

  if ('undefined' !== typeof ENV.CONTAINERIZED) {
    log('warning', `♻️ - Found "CONTAINERIZED" env, setting host to "0.0.0.0"`);
    return '0.0.0.0';
  }

  if ('undefined' !== typeof ENV.DEV_MODE) {
    log('warning', `♻️ - Found "DEV_MODE" env, setting host to "127.0.0.1"`);
    return '127.0.0.1';
  }

  if (!HOST) {
    log('warning', `🚫 - Could not detect any host. Fallback to "localhost".`);
    return 'localhost';
  }

  log('warning', `✔ - Using detected host "${HOST}".`);

  return HOST;
}
