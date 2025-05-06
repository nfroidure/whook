import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';
import { ExpressiveJSONSchema } from 'ya-json-schema-types';

export const streamSchema = {
  name: 'Stream',
  schema: {
    type: 'string',
    format: 'binary',
    // Cast is required since 'binary' format
    //  is not officially supported by JSONSchema
  } as unknown as ExpressiveJSONSchema,
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Echo']>;

export const streamResponse = {
  name: 'Stream',
  response: {
    content: {
      'application/octet-stream': {
        schema: refersTo(streamSchema),
      },
    },
  },
} as const satisfies WhookAPIResponseDefinition;

export const streamRequestBody = {
  name: 'Stream',
  requestBody: {
    required: true,
    content: {
      'application/octet-stream': {
        schema: refersTo(streamSchema),
      },
    },
  },
} as const satisfies WhookAPIRequestBodyDefinition;

/* Architecture Note #3.4.5: putEchoedStream

Simply outputs its input but as a stream.
*/
export const definition = {
  path: '/stream',
  method: 'put',
  operation: {
    operationId: 'putEchoedStream',
    summary: 'Echoes what it takes.',
    tags: ['example'],
    /* Architecture Note #3.1.3.1: Usage

    To use reusable schemas, you must refer to it
     instead of writing it inline.
    
    You can use it in request/response bodies,
     inside parameters or even inside other
     schemas as per the OpenAPI specification.
    */
    requestBody: refersTo(streamRequestBody),
    responses: {
      201: refersTo(streamResponse),
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPutEchoedStream({ log }: { log: LogService }) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ body }) => {
    log('warning', `📢 - Echoing "[Stream]"`);

    return {
      status: 201,
      body,
    };
  };

  return handler;
}

export default autoService(initPutEchoedStream);
