import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';
import path from 'path';
import YError from 'yerror';
import { LogService } from 'common-services';

// Needed to avoid messing up babel builds 🤷
const _require = require;

export interface CONFIGSService {
  [name: string]: any;
}

export interface WhookConfig {
  name: string;
  description?: string;
  baseURL?: string;
}

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
 * Initialize the CONFIGS service according to the NODE_ENV
 * @param  {Object}   services
 * The services CONFIGS depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   [log=noop]
 * An optional logging service
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
async function initCONFIGS({
  PROJECT_SRC,
  NODE_ENV,
  log = noop,
  require = _require,
}: {
  PROJECT_SRC: string;
  NODE_ENV: string;
  log?: LogService;
  require?: typeof _require;
}): Promise<CONFIGSService> {
  log('debug', `🏭 - Initializing the CONFIGS service.`);

  const configPath = path.join(PROJECT_SRC, 'config', NODE_ENV, 'config');

  log('warning', `⚡ - Loading configurations from ${configPath}.`);

  try {
    return require(configPath).default;
  } catch (err) {
    log('warning', `☢ - Could not load configuration file: ${configPath}.`);
    log('stack', err.stack);
    throw YError.wrap(err, 'E_NO_CONFIG', configPath);
  }
}
