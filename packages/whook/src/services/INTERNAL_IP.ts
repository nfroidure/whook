import { autoService, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type ImporterService, type LogService } from 'common-services';

/* Architecture Note #2.2.1: Internal IP detection

This service detects the machine internal IP automagically.
 */
export interface InternalIPModule {
  internalIpV4: () => Promise<string>;
}
export type WhookInternalIP = string;

/**
 * Initialize the INTERNAL_IP service
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<String>}
 * A promise of containing the actual internal IP.
 */
async function initInternalIP({
  log = noop,
  importer,
}: {
  log?: LogService;
  importer: ImporterService<InternalIPModule>;
}): Promise<WhookInternalIP> {
  log('debug', `🏭 - Initializing the INTERNAL_IP service.`);

  return await (await importer('internal-ip')).internalIpV4();
}

export default location(
  name('INTERNAL_IP', autoService(initInternalIP)),
  import.meta.url,
);
