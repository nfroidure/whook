import { autoService, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService, type ImporterService } from 'common-services';

const DEFAULT_ENV = {};

export type PortFinderModule = { getPortPromise: () => Promise<number> };

/* Architecture Note #2.3: Port detection
If no `PORT` configuration is specified in dependencies nor in ENV,
this service detects a free port automagically.
*/

export type WhookPort = number;
export type WhookPortEnv = {
  PORT?: string;
};

export default location(name('PORT', autoService(initPort)), import.meta.url);

/**
 * Initialize the PORT service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The service dependencies
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
  ENV?: WhookPortEnv;
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
