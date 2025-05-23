/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initREPL from './repl.js';
import { PassThrough } from 'node:stream';
import streamtest from 'streamtest';
import { type LogService } from 'common-services';
import { type Injector, type Disposer } from 'knifecycle';

describe('initREPL', () => {
  const $injector = jest.fn<Injector<any>>();
  const $dispose = jest.fn<Disposer>();
  const log = jest.fn<LogService>();

  beforeEach(() => {
    $injector.mockReset();
    $dispose.mockReset();
    log.mockReset();
  });

  test('should work as expected', async () => {
    const stdin = new PassThrough();
    const [stdout, textPromise] = streamtest.toText();
    const injectorPromise = new Promise<void>((resolve) => {
      $injector.mockImplementation(() => {
        resolve();

        return Promise.resolve({
          time: () => Date.parse('2020-01-01T00:00:00Z'),
        });
      });
    });

    const { dispose } = await initREPL({
      $injector,
      $dispose,
      log,
      stdin: stdin as unknown as typeof process.stdin,
      stdout: stdout as unknown as typeof process.stdout,
    });

    stdin.write('.inject time;\n\n');
    await injectorPromise;

    stdin.write('time();\n\n');

    if (dispose) {
      await dispose();
    }

    stdout.end();

    expect({
      text: await textPromise,
      disposeCalls: $dispose.mock.calls,
      injectorCalls: $injector.mock.calls,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
    }).toMatchInlineSnapshot(`
      {
        "disposeCalls": [
          [],
        ],
        "injectorCalls": [
          [
            [
              "time;",
            ],
          ],
        ],
        "logCalls": [
          [
            "debug",
            "🖵 - Initializing the REPL service!",
          ],
        ],
        "text": "
          _      ____             __     ___  _______  __ 
          | | /| / / /  ___  ___  / /__  / _ \\/ __/ _ \\/ / 
          | |/ |/ / _ \\/ _ \\/ _ \\/  '_/ / , _/ _// ___/ /__
          |__/|__/_//_/\\___/\\___/_/\\_\\ /_/|_/___/_/  /____/

                 Inject services with \`.inject\`.
                 > .inject log
                 > log('info', '👋 - Hello REPL!'); 
      whook> whook> whook> 1577836800000
      whook> whook> ",
      }
    `);
  });
});
