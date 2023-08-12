import { autoService } from 'knifecycle';
import { printStackTrace, YError } from 'yerror';

export default autoService(initCommand);

async function initCommand({ commandHandler, log }) {
  return async function commandRunner() {
    try {
      await commandHandler();
    } catch (err) {
      if ((err as YError).code === 'E_BAD_ARGS') {
        log('error-stack', printStackTrace(err as Error));
        if ((err as YError).params[0][0].keyword === 'required') {
          if ((err as YError).params[0][0].params.missingProperty) {
            log(
              'error',
              `Argument "${
                (err as YError).params[0][0].params.missingProperty
              }" is required.`,
            );
            throw err;
          }
        }
        if ((err as YError).params[0][0].keyword === 'additionalProperties') {
          if ((err as YError).params[0][0].params.additionalProperty === '_') {
            log('error', 'No anonymous arguments allowed.');
            throw err;
          }
          if ((err as YError).params[0][0].params.additionalProperty) {
            log(
              'error',
              `Argument "${
                (err as YError).params[0][0].params.additionalProperty
              }" not allowed.`,
            );
            throw err;
          }
        }
        log(
          'error',
          'Error parsing arguments: ',
          (err as YError).params[0][0].message,
          (err as YError).params[0][0].params,
        );
        throw err;
      }
      throw err;
    }
  };
}
