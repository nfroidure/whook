import { initializer } from 'knifecycle';
import { noop } from '../libs/utils';

export default initializer(
  {
    name: 'handlerRunner',
    inject: ['handler', 'parameters', '?log'],
    type: 'service',
    options: { singleton: true },
  },
  initHandlerRunner,
);

async function initHandlerRunner({ handler, parameters, log = noop }) {
  return handlerRunner;

  async function handlerRunner() {
    log('info', 'parameters', parameters);

    try {
      const response = await handler(parameters);

      log('info', 'response', JSON.stringify(response, null, 2));
      return response;
    } catch (err) {
      log('error', err.stack);
    }
  }
}
