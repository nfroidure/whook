import { autoService, options } from 'knifecycle';

export default options({ singleton: true }, autoService(initCommand));

async function initCommand({ args, log, $injector }) {
  if (!args._.length) {
    return async () => {
      log('info', `No command given in argument.`);
    };
  }

  const serviceName = args._[0] + 'Command';

  return (await $injector([serviceName]))[serviceName];
}
