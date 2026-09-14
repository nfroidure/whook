import { autoService, location, name } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { YError } from 'yerror';
import { type WhookBasePath, type WhookConfig } from './BASE_URL.js';

/* Architecture Note #2.1.1: Base PATH
The `BASE_PATH` service allows to mount the API to
 a given sub path.
*/

export const WHOOK_DEFAULT_BASE_PATH: WhookBasePath = '';

export interface WhookBasePathEnv {
  BASE_PATH?: string;
}
export interface WhookBasePathConfig {
  CONFIG: WhookConfig;
}
export type WhookBasePathDependencies = WhookBasePathConfig & {
  ENV: WhookBasePathEnv;
  log?: LogService;
};

/**
 * Initialize the BASE_PATH service.
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   services.ENV
 * The process environment
 * @param  {Object}   services.CONFIG
 * The injected CONFIG value
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<String>}
 * A promise of a containing the actual host.
 */
async function initBasePath({
  ENV,
  CONFIG,
  log = noop,
}: WhookBasePathDependencies): Promise<WhookBasePath> {
  const BASE_PATH = ENV.BASE_PATH ?? CONFIG.basePath ?? WHOOK_DEFAULT_BASE_PATH;

  log('debug', `🈁 - Generated the BASE_PATH constant "${BASE_PATH}".`);

  if (BASE_PATH) {
    if (
      !BASE_PATH.startsWith('/') ||
      BASE_PATH.endsWith('/') ||
      BASE_PATH.includes('..') ||
      !/^\/[a-zA-Z0-9_\-/]*$/.test(BASE_PATH)
    ) {
      throw new YError('E_BAD_BASE_PATH', [BASE_PATH]);
    }
  }

  return BASE_PATH as WhookBasePath;
}

export default location(
  name('BASE_PATH', autoService(initBasePath)),
  import.meta.url,
);
