import { autoService } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { type LogService } from 'common-services';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIHandlerDefinition,
  type WhookAPITypedHandler,
} from '@whook/whook';

/* Architecture Note #3.1.3: Reusable schemas

This is how to declare a reusable API schema
 to avoid having to write it several times and
 lower your final Open API file weight.

You simply have to export a variable finishing with
 the `Schema` suffix and assign it the
 `WhookAPISchemaDefinition` type to be guided
 when creating it.
*/
export const echoSchema = {
  name: 'Echo',
  example: {
    echo: 'Repeat this!',
  },
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
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Echo']>;

/* Architecture Note #3.1.4: Reusable responses

This is how to declare a reusable API response
 to avoid having to write it several times and
 lower your final Open API file weight.

You simply have to export a variable finishing with
 the `Response` suffix and assign it the
 `WhookAPIResponseDefinition` type to be guided
 when creating it.
*/
export const echoResponse = {
  name: 'Echo',
  response: {
    description: 'Echo response',
    content: {
      'application/json': {
        schema: refersTo(echoSchema),
      },
    },
  },
} as const satisfies WhookAPIResponseDefinition;

/* Architecture Note #3.1.4: Reusable request bodies

This is how to declare a reusable API request body
 to avoid having to write it several times and
 lower your final Open API file weight.

You simply have to export a variable finishing with
 the `RequestBody` suffix and assign it the
 `WhookAPIRequestBodyDefinition` type to be guided
 when creating it.
*/
export const echoRequestBody = {
  name: 'Echo',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: refersTo(echoSchema),
      },
    },
  },
} as const satisfies WhookAPIRequestBodyDefinition;

/* Architecture Note #3.4.4: putEcho

Simply outputs its input.
*/
export const definition = {
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
    requestBody: refersTo(echoRequestBody),
    responses: {
      200: refersTo(echoResponse),
    },
  },
} as const satisfies WhookAPIHandlerDefinition;

async function initPutEcho({ log }: { log: LogService }) {
  const handler: WhookAPITypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ body }) => {
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
  };

  return handler;
}

export default autoService(initPutEcho);
