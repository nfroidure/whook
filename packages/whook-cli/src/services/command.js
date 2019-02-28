import { autoService, options } from 'knifecycle';

export default options({ singleton: true }, autoService(initCommand));

async function initCommand({ args, log, $injector }) {
  if (!args._.length) {
    return async () => {
      log('warning', `No command given in argument.`);
    };
  }

  const serviceName = args._[0] + 'Command';
  const command = (await $injector([serviceName]))[serviceName];

  return async () => {
    try {
      await command();
    } catch (err) {
      if (err.code === 'E_BAD_ARGS') {
        log('error', 'Error parsing arguments: ', err.params[0][0].message);
        log('stack', err.stack);
        return;
      }
      throw err;
    }
  };
}
