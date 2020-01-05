import { autoHandler } from 'knifecycle';
import {
  WhookAPIHandlerDefinition,
  WhookResponse,
  WhookAPISchemaDefinition,
} from '@whook/whook';
import { TimeService } from 'common-services';

export const timeSchema: WhookAPISchemaDefinition = {
  name: 'TimeSchema',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      currentDate: { type: 'string', format: 'date-time' },
    },
  },
};

export const definition: WhookAPIHandlerDefinition = {
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
              $ref: `#/components/schemas/${timeSchema.name}`,
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
