import { describe, it, jest, expect } from '@jest/globals';
import { constant } from 'knifecycle';
import { prepareEnvironment as basePrepareEnvironment } from './index.js';
import { runREPL } from './repl.js';
import initREPL from './services/repl.js';
import { PassThrough } from 'stream';
import type { Logger } from 'common-services';

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

      $.register(
        constant('ENV', {
          NODE_ENV: 'test',
        }),
      );
      $.register(constant('DEBUG_NODE_ENVS', []));
      $.register(constant('APP_ENV', 'local'));
      $.register(constant('logger', logger as Logger));
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
