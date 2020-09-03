import { autoHandler } from 'knifecycle';
import YHTTPError from 'yhttperror';
import type { LogService } from 'common-services';
import type {
  WhookAPIHandlerDefinition,
  WhookAPISchemaDefinition,
} from '@whook/whook';

export const echoSchema: WhookAPISchemaDefinition<Components.Schemas.Echo> = {
  name: 'Echo',
  schema: {
    type: 'object',
    required: ['echo'],
    additionalProperties: false,
    properties: {
      echo: {
        type: 'string',
      },
    },
  },
};

export const definition: WhookAPIHandlerDefinition = {
  path: '/echo',
  method: 'put',
  operation: {
    operationId: 'putEcho',
    summary: 'Echoes what it takes.',
    tags: ['example'],
    requestBody: {
      description: 'The input sentence',
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${echoSchema.name}`,
          },
          example: {
            echo: 'Repeat this!',
          },
        },
      },
    },
    responses: {
      200: {
        description: 'The actual echo',
        content: {
          'application/json': {
            schema: {
              $ref: `#/components/schemas/${echoSchema.name}`,
            },
          },
        },
      },
    },
  },
};

export default autoHandler(putEcho);

async function putEcho(
  { log }: { log: LogService },
  { body }: API.PutEcho.Input,
): Promise<API.PutEcho.Output> {
  if (body.echo.includes('Voldemort')) {
    throw new YHTTPError(400, 'E_MUST_NOT_BE_NAMED', body.echo);
  }

  log('warning', `📢 - Echoing "${body.echo}"`);

  return {
    status: 200,
    body,
  };
}
