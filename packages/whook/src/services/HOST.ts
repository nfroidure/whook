import { autoService, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type ImporterService, type LogService } from 'common-services';

const DEFAULT_ENV = {};

/* Architecture Note #2.2: IP detection
If no `HOST` configuration is specified in dependencies nor in ENV,
 this service detects the machine host automagically.
*/

export default location(name('HOST', autoService(initHost)), import.meta.url);

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
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initHost({
  ENV = DEFAULT_ENV,
  log = noop,
  importer,
}: {
  ENV?: WhookHostEnv;
  log?: LogService;
  importer: ImporterService<{ internalIpV4: () => Promise<string> }>;
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

  const host = await (await importer('internal-ip')).internalIpV4();

  if (!host) {
    log('warning', `🚫 - Could not detect any host. Fallback to "localhost".`);
    return 'localhost';
  }

  log('warning', `✔ - Using detected host "${host}".`);

  return host;
}
