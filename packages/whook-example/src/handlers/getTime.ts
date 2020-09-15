import { autoHandler } from 'knifecycle';
import type {
  WhookAPIHandlerDefinition,
  WhookAPISchemaDefinition,
} from '@whook/whook';
import type { TimeService } from 'common-services';

export const timeSchema: WhookAPISchemaDefinition<Components.Schemas.TimeSchema> = {
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
}): Promise<API.GetTime.Output> {
  return {
    status: 200,
    body: {
      currentDate: new Date(time()).toISOString(),
    },
  };
}
