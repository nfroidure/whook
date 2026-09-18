import { autoService, name, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { type LogService } from 'common-services';
import { YError } from 'yerror';
import { parseInteger } from '../libs/coercion.js';

const DEFAULT_ENV = {};

/* Architecture Note #2.3: Port

Provides a `PORT` from the ENV var and checks its value.
*/

export type WhookPort = number;
export interface WhookPortEnv {
  PORT?: string;
}

/**
 * Initialize the PORT service from ENV
 * @param  {Object}   services
 * The service dependencies
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Function}   [services.log=noop]
 * An optional logging service
 * @return {Promise<Number>}
 * A promise of a number representing the actual port.
 */
async function initPort({
  ENV = DEFAULT_ENV,
  log = noop,
}: {
  ENV?: WhookPortEnv;
  log?: LogService;
}): Promise<number> {
  log('debug', `🏭 - Initializing the PORT service.`);

  if ('undefined' !== typeof ENV.PORT) {
    log('warning', `♻️ - Using ENV port "${ENV.PORT}"`);

    let PORT: number;

    try {
      PORT = parseInteger({ strictlyReentrant: true }, ENV.PORT);
    } catch (err) {
      throw YError.wrap(err as Error, 'E_BAD_ENV_VALUE', ['PORT', ENV.PORT]);
    }

    if (PORT < 0 || PORT > 65535) {
      throw new YError('E_BAD_ENV_VALUE', ['PORT', ENV.PORT]);
    }

    return PORT;
  }

  throw new YError('E_NO_ENV_VALUE', ['PORT']);
}

export default location(name('PORT', autoService(initPort)), import.meta.url);
