import { autoHandler } from 'knifecycle';
import YHTTPError from 'yhttperror';
import type { WhookAPIHandlerDefinition, WhookResponse } from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';
import type { LogService } from 'common-services';

const echoSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  required: ['echo'],
  additionalProperties: false,
  properties: {
    echo: {
      type: 'string',
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
          schema: echoSchema,
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
            schema: echoSchema,
          },
        },
      },
    },
  },
};

export default autoHandler(putEcho);

type Echo = { echo: string };

async function putEcho(
  { log }: { log: LogService },
  { body }: { body: Echo },
): Promise<WhookResponse<200, {}, Echo>> {
  if (body.echo.includes('Voldemort')) {
    throw new YHTTPError(400, 'E_MUST_NOT_BE_NAMED', body.echo);
  }

  log('warning', `📢 - Echoing "${body.echo}"`);

  return {
    status: 200,
    body,
  };
}
