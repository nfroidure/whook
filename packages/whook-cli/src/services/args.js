import { autoService, options } from 'knifecycle';
import parseArgs from 'yargs-parser';

export default options({ singleton: true }, autoService(initArgs));

async function initArgs({ ARGS, log }) {
  const args = parseArgs(ARGS.slice(2));

  log('debug', '🛠 - Parsed args:', args);
  return args;
}
