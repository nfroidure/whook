import { autoService, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService, type ImporterService } from 'common-services';

export interface PortFinderModule {
  getPortPromise: () => Promise<number>;
}
export type WhookAvailablePort = number;

/* Architecture Note #2.3.1: Available port detection
This service detects a free port automagically.
 */

export default location(
  name('AVAILABLE_PORT', autoService(initAvailablePort)),
  import.meta.url,
);

/**
 * Initialize the AVAILABLE_PORT service
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<Number>}
 * A promise of a number representing the available port.
 */
async function initAvailablePort({
  log = noop,
  importer,
}: {
  log?: LogService;
  importer: ImporterService<PortFinderModule>;
}): Promise<WhookAvailablePort> {
  log('debug', `🏭 - Initializing the AVAILABLE_PORT service.`);

  return await (await importer('portfinder')).getPortPromise();
}
