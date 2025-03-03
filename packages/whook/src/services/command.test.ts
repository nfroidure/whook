import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initCommand from './command.js';
import { definition as initEnvCommandDefinition } from '../commands/env.js';
import { type LogService } from 'common-services';
import { type FatalErrorService, type Knifecycle } from 'knifecycle';
import { YError } from 'yerror';
import { DEFAULT_COERCION_OPTIONS } from '../libs/coercion.js';
import { type WhookSchemaValidatorsService } from './schemaValidators.js';
import { type WhookOpenAPI } from '../types/openapi.js';
import { ValidateFunction } from 'ajv';

describe('command', () => {
  const API = {} as unknown as WhookOpenAPI;
  const log = jest.fn<LogService>();
  const schemaValidators = jest.fn<WhookSchemaValidatorsService>();
  const validator = jest.fn<ValidateFunction>();

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

    schemaValidators.mockReturnValue(validator as unknown as ValidateFunction);

    await initCommand({
      API,
      COMMAND_DEFINITION: initEnvCommandDefinition,
      COERCION_OPTIONS: DEFAULT_COERCION_OPTIONS,
      commandHandler,
      schemaValidators,
      args: {
        command: 'whook',
        rest: ['env'],
        namedArguments: {
          name: 'APP_ENV',
          default: 'test',
        },
      },
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

    schemaValidators.mockReturnValue(validator as unknown as ValidateFunction);

    await initCommand({
      API,
      COMMAND_DEFINITION: initEnvCommandDefinition,
      COERCION_OPTIONS: DEFAULT_COERCION_OPTIONS,
      commandHandler,
      schemaValidators,
      args: {
        command: 'whook',
        rest: ['env'],
        namedArguments: {
          name: 'APP_ENV',
          default: 'test',
        },
      },
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
