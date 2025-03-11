import { autoService } from 'knifecycle';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { type TimeService } from 'common-services';

export const timeSchema = {
  name: 'TimeSchema',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      currentDate: {
        type: 'string',
        format: 'date-time',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition<
  components['schemas']['TimeSchema']
>;

/* Architecture Note #3.4.3: getTime

Returns the server time.
*/
export const definition = {
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
            schema: refersTo(timeSchema),
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetTime({ time }: { time: TimeService }) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async () => ({
    status: 200,
    body: {
      currentDate: new Date(time()).toISOString(),
    },
  });

  return handler;
}

export default autoService(initGetTime);
