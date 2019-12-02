import { autoService, options } from 'knifecycle';

export default options({ singleton: true }, autoService(initCommand));

async function initCommand({ commandHandler, log }) {
  return async function commandRunner() {
    try {
      await commandHandler();
    } catch (err) {
      if (err.code === 'E_BAD_ARGS') {
        log('stack', err.stack);
        if (err.params[0][0].keyword === 'required') {
          if (err.params[0][0].params.missingProperty) {
            log(
              'error',
              `Argument "${err.params[0][0].params.missingProperty}" is required.`,
            );
            return;
          }
        }
        if (err.params[0][0].keyword === 'additionalProperties') {
          if (err.params[0][0].params.additionalProperty === '_') {
            log('error', 'No anonymous arguments allowed.');
            return;
          }
          if (err.params[0][0].params.additionalProperty) {
            log(
              'error',
              `Argument "${err.params[0][0].params.additionalProperty}" not allowed.`,
            );
            return;
          }
        }
        log(
          'error',
          'Error parsing arguments: ',
          err.params[0][0].message,
          err.params[0][0].params,
        );
        return;
      }
      throw err;
    }
  };
}
