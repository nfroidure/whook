import { constant } from 'knifecycle';
import { prepareEnvironment as basePrepareEnvironment } from './index';
import { runREPL } from './repl';
import initREPL from './services/repl';
import { PassThrough } from 'stream';

describe('runREPL', () => {
  it('should work', async () => {
    const logger = {
      output: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    const stdin = new PassThrough();
    const stdout = new PassThrough();

    async function prepareEnvironment() {
      const $ = await basePrepareEnvironment();

      $.register(constant('ENV', {}));
      $.register(constant('NODE_ENV', 'test'));
      $.register(constant('DEBUG_NODE_ENVS', []));
      $.register(constant('NODE_ENVS', ['test']));
      $.register(constant('logger', logger));
      $.register(constant('stdin', stdin));
      $.register(constant('stdout', stdout));
      $.register(initREPL);

      return $;
    }
    process.env.ISOLATED_ENV = '1';

    const { $instance } = await runREPL(prepareEnvironment);

    await $instance.destroy();

    expect({
      debugCalls: logger.debug.mock.calls.sort(sortLogs),
      logInfoCalls: logger.output.mock.calls,
      logErrorCalls: logger.error.mock.calls,
    }).toMatchSnapshot();
  });
});

function sortLogs(strs1, strs2) {
  return strs1[0] > strs2[0] ? 1 : strs1[0] === strs2[0] ? 0 : -1;
}
