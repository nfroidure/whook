import { name, autoService } from 'knifecycle';
import type { LogService } from 'common-services';

export type APMService<T = string> = (type: T, data: any) => void;

export default name('apm', autoService(initAPM));

const noop = () => undefined;

/**
 * Application monitoring service that simply log stringified contents.
 * @function
 * @param  {Object}     services
 * The services to inject
 * @param  {Function}   [services.log]
 * A logging function
 * @return {Promise<Object>}
 * A promise of the apm service.
 */
async function initAPM<T = string>({
  log = noop,
}: {
  log: LogService;
}): Promise<APMService<T>> {
  log('debug', '❤️ - Initializing the APM service.');

  return (type, data) => log('info', type, JSON.stringify(data));
}
