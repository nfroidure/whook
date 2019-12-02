import { autoHandler } from 'knifecycle';
import { WhookDefinition, WhookResponse } from '@whook/whook';
import { TimeService } from 'common-services';

export const definition: WhookDefinition = {
  path: '/time',
  method: 'get',
  operation: {
    operationId: 'getTime',
    summary: 'Get API internal clock date.',
    tags: ['system'],
    responses: {
      200: {
        description: 'Server current date',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                currentDate: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
    },
  },
};

export default autoHandler(getTime);

async function getTime({
  time,
}: {
  time: TimeService;
}): Promise<WhookResponse> {
  return {
    status: 200,
    body: {
      time: time(),
    },
  };
}
