import { autoHandler } from 'knifecycle';
import YHTTPError from 'yhttperror';
import type { LogService } from 'common-services';
import type { WhookAPISchemaDefinition } from '@whook/whook';
import type { APIHandlerDefinition } from '../config/common/config';

/* Architecture Note #3.1.3: Reusable schemas

This is how to declare a reusable API schema
 to avoid having to write it several times and
 lower your final Open API file weight.
*/
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

/* Architecture Note #3.4.4: putEcho

Simply outputs its input.
*/
export const definition: APIHandlerDefinition = {
  path: '/echo',
  method: 'put',
  operation: {
    operationId: 'putEcho',
    summary: 'Echoes what it takes.',
    tags: ['example'],
    /* Architecture Note #3.1.3.1: Usage

    To use reusable schemas, you must refer to it
     instead of writing it inline.
    
    You can use it in request/response bodies,
     inside parameters or even inside other
     schemas as per the OpenAPI specification.
    */
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
    /* Architecture Note #3.1.3.2: Typings

    Schemas are converted to types so that
     TypeScript warns you when you don't output
     the expected data.
    */
    body,
  };
}
