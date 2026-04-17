import { service } from 'knifecycle';
import { noop } from 'common-services';

/**
 * A simple noop service.
 * @function
 */
export default service(async () => noop, 'noop');
