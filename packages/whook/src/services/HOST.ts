import { name, autoService, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';

/* Architecture Note #2.2: Host

If no `HOST` configuration is specified, this service tries
 to find it in environment variable or fallback to the loopback
 interface.
*/

const DEFAULT_ENV = {};

export type WhookHost = string;
export interface WhookHostEnv {
  HOST?: WhookHost;
  CONTAINERIZED?: string;
}

/**
 * Initialize the HOST service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initHost({
  ENV = DEFAULT_ENV,
  log = noop,
}: {
  ENV?: WhookHostEnv;
  log?: LogService;
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

  return '127.0.0.1';
}

export default location(name('HOST', autoService(initHost)), import.meta.url);
