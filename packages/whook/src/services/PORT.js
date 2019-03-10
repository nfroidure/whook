import portfinder from 'portfinder';
import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

/* Architecture Note #7: Port detection
If no `PORT` configuration is specified in dependencies nor in ENV,
 this service detects a free port automagically.
*/

export default initializer(
  {
    name: 'PORT',
    type: 'service',
    inject: ['?ENV', '?log'],
    options: { singleton: true },
  },
  initPort,
);

/**
 * Initialize the PORT service from ENV or auto-detection if
 *  none specified in ENV
 * @param  {Object}   services
 * The services PORT depends on
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Number>}
 * A promise of a number representing the actual port.
 */
async function initPort({ ENV = {}, log = noop }) {
  log('debug', `🏭 - Initializing the PORT service.`);

  if ('undefined' !== typeof ENV.PORT) {
    log('warning', `♻️ - Using ENV port ${ENV.PORT}`);
    return ENV.PORT;
  }
  const port = await portfinder.getPortPromise();

  if (!port) {
    log('warning', `🚫 - Could not detect any free port.`);
    return 8080;
  }

  log('warning', `✔ - Found a free port ${port}`);

  return port;
}
