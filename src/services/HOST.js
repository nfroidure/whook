import internalIp from 'internal-ip';
import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

/* Architecture Note #1: IP detection
If no `HOST` configuration is specified, this service detects
 the machine host automagically.
*/

export default initializer(
  {
    name: 'HOST',
    type: 'service',
    inject: ['?ENV', '?log'],
    options: { singleton: true },
  },
  async ({ ENV = {}, log = noop }) => {
    const host = ENV.host || (await internalIp.v4());

    log('info', `Using detected host ${host}`);

    return host;
  },
);
