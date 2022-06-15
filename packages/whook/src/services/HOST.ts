import { autoService, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { LogService } from 'common-services';
import type { ImporterService } from '../index.js';

const DEFAULT_ENV = {};

/* Architecture Note #6: IP detection
If no `HOST` configuration is specified in dependencies nor in ENV,
 this service detects the machine host automagically.
*/

export default name('HOST', autoService(initHost));

export type HostEnv = {
  HOST?: string;
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
  ENV?: HostEnv;
  log?: LogService;
  importer: ImporterService<{ v4: () => Promise<string> }>;
}): Promise<string> {
  log('debug', `🏭 - Initializing the HOST service.`);

  if ('undefined' !== typeof ENV.HOST) {
    log('warning', `♻️ - Using ENV host "${ENV.HOST}"`);
    return ENV.HOST;
  }
  const host = await (await importer('internal-ip')).v4();

  if (!host) {
    log(
      'warning',
      `🚫 - Could not detect any host. Fallbacking to "localhost".`,
    );
    return 'localhost';
  }

  log('warning', `✔ - Using detected host "${host}".`);

  return host;
}
