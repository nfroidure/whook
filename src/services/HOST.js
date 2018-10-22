import internalIp from 'internal-ip';
import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

/* Architecture Note #1: IP detection
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
  initHOST,
);

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
async function initHOST({ ENV = {}, log = noop }) {
  if ('undefined' !== typeof ENV.HOST) {
    log('info', `Using ENV host ${ENV.HOST}`);
    return ENV.HOST;
  }
  const host = await internalIp.v4();

  if (!host) {
    log('info', `Could not detect any host. Fallbacking to localhost`);
    return 'localhost';
  }

  log('info', `Using detected host ${host}`);

  return host;
}
