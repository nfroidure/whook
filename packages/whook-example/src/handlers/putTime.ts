import {
  type WhookAPIHandlerDefinition,
  type WhookResponse,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import { type ClockMockService } from 'application-services';
import { autoHandler } from 'knifecycle';
import { YError } from 'yerror';
import { env } from 'node:process';

import { type AppEnv } from '../index.js';
import { type TimeMockService } from 'application-services/dist/services/timeMock.js';

export const definition: WhookAPIHandlerDefinition = {
  path: '/time',
  method: 'put',
  operation: {
    'x-whook': {
      type: 'http',
      disabled: env.APP_ENV !== 'test',
    },
    operationId: 'putTime',
    summary: 'Allows to set the time like the great random god',
    tags: ['system'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              time: { type: 'number' },
              isFixed: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'number',
            },
          },
        },
      },
    },
  },
};

export default autoHandler(putTime);

async function putTime(
  {
    APP_ENV,
    CLOCK_MOCK,
    time,
    timeMock,
    log,
  }: {
    APP_ENV: AppEnv;
    CLOCK_MOCK: ClockMockService;
    time: TimeService;
    timeMock: TimeMockService;
    log: LogService;
  },
  { body }: { body: { time: number; isFixed: boolean } },
): Promise<WhookResponse<201, void, number>> {
  if (APP_ENV !== 'local' && APP_ENV !== 'test') {
    throw new YError('E_NO_MOCK_IN_PROD', APP_ENV);
  }

  CLOCK_MOCK.isFixed = body.isFixed;
  CLOCK_MOCK.mockedTime = body.time;

  if (!CLOCK_MOCK.isFixed) {
    CLOCK_MOCK.referenceTime = time();
  }

  log('warning', `⌚ - Set time to "${new Date(body.time).toISOString()}".`);

  return {
    status: 201,
    body: timeMock(),
  };
}
