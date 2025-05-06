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
export type WhookHostEnv = {
  HOST?: WhookHost;
};

/**
 * Initialize the HOST service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The services HOST depends on
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [services.log=noop]
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
  const host = await (await importer('internal-ip')).internalIpV4();

  if (!host) {
    log('warning', `🚫 - Could not detect any host. Fallback to "localhost".`);
    return 'localhost';
  }

  log('warning', `✔ - Using detected host "${host}".`);

  return host;
}
