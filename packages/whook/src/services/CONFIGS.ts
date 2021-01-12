import { autoService, singleton, name } from 'knifecycle';
import { noop } from '../libs/utils';
import path from 'path';
import YError from 'yerror';
import type { LogService } from 'common-services';
import type { ImporterService } from './importer';
import type { JsonValue } from 'type-fest';

export type CONFIGSService = Record<string, JsonValue>;
export type CONFIGSConfig = {
  PROJECT_SRC?: string;
  NODE_ENV?: string;
};
export type CONFIGSDependencies = CONFIGSConfig & {
  PROJECT_SRC: string;
  NODE_ENV: string;
  log?: LogService;
};

export type WhookConfig = {
  name: string;
  description?: string;
  baseURL?: string;
};

export default name('CONFIGS', singleton(autoService(initCONFIGS)));

/**
 * Initialize the CONFIGS service according to the NODE_ENV
 * @param  {Object}   services
 * The services CONFIGS depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Object}   services.PROJECT_SRC
 * The project source directory
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.importer
 * A service allowing to dynamically import ES modules
 * @return {Promise<Object>}
 * A promise of a an object the actual configuration properties.
 */
async function initCONFIGS({
  PROJECT_SRC,
  NODE_ENV,
  importer,
  log = noop,
}: {
  PROJECT_SRC: string;
  NODE_ENV: string;
  importer: ImporterService<{ default: CONFIGSService }>;
  log?: LogService;
}): Promise<CONFIGSService> {
  log('debug', `🏭 - Initializing the CONFIGS service.`);

  const configPath = path.join(PROJECT_SRC, 'config', NODE_ENV, 'config');

  log('warning', `⚡ - Loading configurations from "${configPath}".`);

  try {
    return (await importer(configPath)).default;
  } catch (err) {
    log('warning', `☢ - Could not load configuration file "${configPath}".`);
    log('stack', err.stack);
    throw YError.wrap(err, 'E_NO_CONFIG', configPath);
  }
}
