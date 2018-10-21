import portfinder from 'portfinder';
import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

/* Architecture Note #1: Port detection
 If no `PORT` configuration is specified, this service detects
  a free port automagically.
*/

export default initializer(
  {
    name: 'PORT',
    type: 'service',
    inject: ['ENV', '?log'],
    options: { singleton: true },
  },
  async ({ log = noop }) => {
    const port = await portfinder.getPortPromise();

    log('info', `Found a free port ${port}`);

    return port;
  },
);
