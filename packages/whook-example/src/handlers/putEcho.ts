import { autoHandler } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import { type LogService } from 'common-services';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIHandlerDefinition,
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
export const echoSchema: WhookAPISchemaDefinition<Components.Schemas.Echo> = {
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
};

/* Architecture Note #3.1.4: Reusable responses

This is how to declare a reusable API response
 to avoid having to write it several times and
 lower your final Open API file weight.

You simply have to export a variable finishing with
 the `Response` suffix and assign it the
 `WhookAPIResponseDefinition` type to be guided
 when creating it.
*/
export const echoResponse: WhookAPIResponseDefinition = {
  name: 'Echo',
  response: {
    description: 'Echo response',
    content: {
      'application/json': {
        schema: refersTo(echoSchema),
      },
    },
  },
};

/* Architecture Note #3.1.4: Reusable request bodies

This is how to declare a reusable API request body
 to avoid having to write it several times and
 lower your final Open API file weight.

You simply have to export a variable finishing with
 the `RequestBody` suffix and assign it the
 `WhookAPIRequestBodyDefinition` type to be guided
 when creating it.
*/
export const echoRequestBody: WhookAPIRequestBodyDefinition = {
  name: 'Echo',
  requestBody: {
    required: true,
    content: {
      'application/json': {
        schema: refersTo(echoSchema),
      },
    },
  },
};

/* Architecture Note #3.4.4: putEcho

Simply outputs its input.
*/
export const definition: WhookAPIHandlerDefinition = {
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
