import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';
import path from 'path';
import YError from 'yerror';

const _require = require;

export default initializer(
  {
    name: 'CONFIGS',
    type: 'service',
    inject: ['PROJECT_SRC', 'NODE_ENV', '?log'],
    options: { singleton: true },
  },
  initCONFIGS,
);

/**
 * Initialize the CONFIGS serviceaccording to the NODE_ENV
 * @param  {Object}   services
 * The services CONFIGS depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initCONFIGS({
  PROJECT_SRC,
  NODE_ENV,
  log = noop,
  require = _require,
}) {
  log('debug', `🏭 - Initializing the CONFIGS service.`);

  const configPath = path.join(PROJECT_SRC, 'config', NODE_ENV, 'config');

  log('warning', `⚡ - Loading configurations from ${configPath}.`);

  try {
    return require(configPath).default;
  } catch (err) {
    log('warning', `☢ - Could not load configuration file: ${configPath}.`);
    throw YError.wrap('E_NO_CONFIG', configPath);
  }
}
