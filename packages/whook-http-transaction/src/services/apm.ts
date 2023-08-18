import { name, autoService } from 'knifecycle';
import type { LogService } from 'common-services';
import type { JsonValue } from 'type-fest';

export type WhookAPMDependencies = {
  log: LogService;
};
export type WhookAPMService<T extends string = string> = (
  type: T,
  data: JsonValue,
) => void;

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
async function initAPM<T extends string = string>({
  log = noop,
}: WhookAPMDependencies): Promise<WhookAPMService<T>> {
  log('debug', '❤️ - Initializing the APM service.');

  return (type, data) => log('info', type, JSON.stringify(data));
}
