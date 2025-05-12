import { describe, test, beforeEach, jest, expect } from '@jest/globals';
import initPostCronRun, { dateSchema } from './postCronRun.js';
import initHandleMinutes, { definition } from '../crons/handleMinutes.js';
import { YError } from 'yerror';
import { type DelayService, type LogService } from 'common-services';
import {
  type WhookCronHandler,
  type WhookCronModule,
  type WhookSchemaValidatorsService,
} from '@whook/whook';
import { type JsonValue } from 'type-fest';
import { type ValidateFunction } from 'ajv';

describe('postCronRun', () => {
  const schemaValidators = jest.fn<WhookSchemaValidatorsService>();
  const schemaValidator = jest.fn<ReturnType<WhookSchemaValidatorsService>>();
  const log = jest.fn<LogService>();
  const delay = {
    create: jest.fn<DelayService['create']>(),
    clear: jest.fn<DelayService['clear']>(),
  };

  beforeEach(() => {
    schemaValidators.mockReset();
    schemaValidator.mockReset();
    log.mockReset();
    delay.create.mockReset();
    delay.clear.mockReset();
  });

  test('should work', async () => {
    const handleMinutes = await initHandleMinutes({
      log,
      delay,
    });
    const postCronRun = await initPostCronRun({
      CRONS_DEFINITIONS: {
        handleMinutes: {
          name: 'handleMinutes',
          pluginName: 'n/a',
          url: 'n/a',
          module: {
            default: initHandleMinutes,
            definition,
          } as unknown as WhookCronModule<JsonValue>,
        },
      },
      CRONS_HANDLERS: {
        handleMinutes: handleMinutes as WhookCronHandler<JsonValue>,
      },
      schemaValidators,
      log,
    });

    schemaValidators.mockReturnValueOnce(
      schemaValidator as unknown as ValidateFunction<unknown>,
    );

    const response = await postCronRun({
      path: {
        cronName: 'handleMinutes',
      },
      query: {
        date: dateSchema.example,
      },
      body: {},
    });

    expect({
      response,
      logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      delayCreateCalls: delay.create.mock.calls,
      delayClearCalls: delay.clear.mock.calls,
      schemaValidators: schemaValidators.mock.calls,
      schemaValidator: schemaValidator.mock.calls,
    }).toMatchInlineSnapshot(`
{
  "delayClearCalls": [],
  "delayCreateCalls": [
    [
      1,
    ],
  ],
  "logCalls": [
    [
      "warning",
      "⌚ - Triggering a "handleMinutes" cron run through the router.",
    ],
    [
      "info",
      "⌚ - Ran the cron at 2010-03-06T20:20:02.02Z, with parameters ({}).",
    ],
  ],
  "response": {
    "status": 204,
  },
  "schemaValidator": [
    [
      {},
    ],
  ],
  "schemaValidators": [
    [
      {
        "$ref": "#/components/schemas/ExampleSchema",
      },
    ],
  ],
}
`);
  });

  test('should fail with a bad cron name', async () => {
    try {
      const handleMinutes = await initHandleMinutes({
        log,
        delay,
      });
      const postCronRun = await initPostCronRun({
        CRONS_DEFINITIONS: {
          handleMinutes: {
            name: 'handleMinutes',
            pluginName: 'n/a',
            url: 'n/a',
            module: {
              default: initHandleMinutes,
              definition,
            } as unknown as WhookCronModule<JsonValue>,
          },
        },
        CRONS_HANDLERS: {
          handleMinutes: handleMinutes as WhookCronHandler<JsonValue>,
        },
        schemaValidators,
        log,
      });

      schemaValidators.mockReturnValueOnce(
        schemaValidator as unknown as ValidateFunction<unknown>,
      );

      await postCronRun({
        path: {
          cronName: 'handleNotExistingCron',
        },
        query: {
          date: dateSchema.example,
        },
        body: {},
      });
      throw new YError('E_UNEXPECTED_SUCCESS');
    } catch (err) {
      expect({
        errorCode: (err as YError).code,
        errorParams: (err as YError).params,
        logCalls: log.mock.calls.filter(([type]) => !type.endsWith('stack')),
      }).toMatchInlineSnapshot(`
{
  "errorCode": "E_BAD_CRON_NAME",
  "errorParams": [
    "handleNotExistingCron",
  ],
  "logCalls": [
    [
      "warning",
      "⌚ - Triggering a "handleNotExistingCron" cron run through the router.",
    ],
  ],
}
`);
    }
  });
});
