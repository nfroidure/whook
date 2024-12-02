import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCommand from './command.js';
import { type LogService } from 'common-services';
import { type FatalErrorService, type Knifecycle } from 'knifecycle';
import { YError } from 'yerror';

describe('command', () => {
  const log = jest.fn<LogService>();

  beforeEach(() => {
    log.mockReset();
  });

  test('should work with no error', async () => {
    const commandHandler = async () => log('info', 'commandHandler ran');
    let resolveWaitProcess;
    const waitProcess = new Promise((resolve) => {
      resolveWaitProcess = resolve;
    });

    const $ready = Promise.resolve();
    const $instance = {
      destroy: resolveWaitProcess,
    } as unknown as Knifecycle;
    const $fatalError = {} as unknown as FatalErrorService;

    await initCommand({
      commandHandler,
      $instance,
      $ready,
      $fatalError,
      log,
    });

    await waitProcess;

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "logCalls": [
          [
            "info",
            "commandHandler ran",
          ],
        ],
      }
    `);
  });

  test('should fail with errors', async () => {
    const commandHandler = async () => {
      throw new YError('E_ERRORING');
    };
    let resolveWaitProcess;
    const waitProcess = new Promise((resolve) => {
      resolveWaitProcess = resolve;
    });

    const $ready = Promise.resolve();
    const $instance = {} as unknown as Knifecycle;
    const $fatalError = {
      throwFatalError: jest.fn().mockImplementationOnce(resolveWaitProcess),
    };

    await initCommand({
      commandHandler,
      $instance,
      $ready,
      $fatalError: $fatalError as unknown as FatalErrorService,
      log,
    });

    await waitProcess;

    expect({
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      fatalErrorCalls: $fatalError.throwFatalError.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "fatalErrorCalls": [
    [
      [YError: E_ERRORING (): E_ERRORING],
    ],
  ],
  "logCalls": [],
}
`);
  });
});
