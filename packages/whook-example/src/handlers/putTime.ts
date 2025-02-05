import {
  type WhookAPITypedHandler,
  type WhookAPIHandlerDefinition,
} from '@whook/whook';
import { type TimeService, type LogService } from 'common-services';
import {
  type ClockMockService,
  type TimeMockService,
} from 'application-services';
import { autoService } from 'knifecycle';
import { YError } from 'yerror';
import { AppEnv } from '../index.js';

export const definition = {
  path: '/time',
  method: 'put',
  config: {
    environments: ['local'],
  },
  operation: {
    operationId: 'putTime',
    summary: 'Allows to set the time like the great random god',
    tags: ['system'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['time'],
            properties: {
              time: { type: 'number' },
              isFixed: { type: 'boolean' },
            },
          },
        },
      },
    },
    responses: {
      201: {
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
} as const satisfies WhookAPIHandlerDefinition;

export default autoService(putTime);

async function putTime({
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
}) {
  const handler: WhookAPITypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ body }) => {
    if (APP_ENV !== 'local' && APP_ENV !== 'test') {
      throw new YError('E_NO_MOCK_IN_PROD', APP_ENV);
    }

    CLOCK_MOCK.isFixed = !!body.isFixed;
    CLOCK_MOCK.mockedTime = body.time;

    if (!CLOCK_MOCK.isFixed) {
      CLOCK_MOCK.referenceTime = time();
    }

    log('warning', `⌚ - Set time to "${new Date(body.time).toISOString()}".`);

    return {
      status: 201,
      body: timeMock(),
    };
  };

  return handler;
}
