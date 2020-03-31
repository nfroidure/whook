import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';
import { LogService } from 'common-services';

// Needed to avoid messing up babel builds 🤷
const _require = require;

/* Architecture Note #6: IP detection
If no `HOST` configuration is specified in dependencies nor in ENV,
 this service detects the machine host automagically.
*/

export default initializer(
  {
    name: 'HOST',
    type: 'service',
    inject: ['?ENV', '?log'],
    options: { singleton: true },
  },
  initHost,
);

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
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initHost({
  ENV = {},
  log = noop,
  require = _require,
}: {
  ENV?: HostEnv;
  log?: LogService;
  require?: typeof _require;
}): Promise<string> {
  log('debug', `🏭 - Initializing the HOST service.`);

  if ('undefined' !== typeof ENV.HOST) {
    log('warning', `♻️ - Using ENV host ${ENV.HOST}`);
    return ENV.HOST;
  }
  const host = (await require('internal-ip').v4()) as string;

  if (!host) {
    log('warning', `🚫 - Could not detect any host. Fallbacking to localhost.`);
    return 'localhost';
  }

  log('warning', `✔ - Using detected host ${host}`);

  return host;
}
