import { autoService, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import type { LogService, ImporterService } from 'common-services';

const DEFAULT_ENV = {};

/* Architecture Note #7: Port detection
If no `PORT` configuration is specified in dependencies nor in ENV,
this service detects a free port automagically.
*/

export type PortFinderModule = { getPortPromise: () => Promise<number> };
export type PortEnv = {
  PORT?: string;
};

export default name('PORT', autoService(initPort));

/**
 * Initialize the PORT service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The services PORT depends on
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<Number>}
 * A promise of a number representing the actual port.
 */
async function initPort({
  ENV = DEFAULT_ENV,
  log = noop,
  importer,
}: {
  ENV?: PortEnv;
  log?: LogService;
  importer: ImporterService<PortFinderModule>;
}): Promise<number> {
  log('debug', `🏭 - Initializing the PORT service.`);

  if ('undefined' !== typeof ENV.PORT) {
    log('warning', `♻️ - Using ENV port "${ENV.PORT}"`);
    return parseInt(ENV.PORT, 10);
  }

  const port = await (await importer('portfinder')).getPortPromise();

  if (!port) {
    log('warning', `🚫 - Could not detect any free port.`);
    return 8080;
  }

  log('warning', `✔ - Found a free port "${port}"`);

  return port;
}
