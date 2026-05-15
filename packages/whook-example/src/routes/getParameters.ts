import { location, service } from 'knifecycle';
import {
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookAPIParameterDefinition,
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';

export const numberSchema = {
  name: 'Number',
  example: 123,
  schema: {
    type: 'number',
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Number']>;

export const pathParam1Parameter = {
  name: 'pathParam1',
  example: 123,
  parameter: {
    in: 'path',
    name: 'pathParam1',
    required: true,
    description: 'A number param',
    schema: refersTo(numberSchema),
  },
} as const satisfies WhookAPIParameterDefinition<
  components['parameters']['pathParam1']
>;

export const stringSchema = {
  name: 'String',
  example: 'str',
  schema: {
    type: 'string',
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['String']>;

export const pathParam2Parameter = {
  name: 'pathParam2',
  example: 'item',
  parameter: {
    in: 'path',
    name: 'pathParam2',
    required: true,
    description: 'A string item',
    schema: refersTo(stringSchema),
  },
} as WhookAPIParameterDefinition<components['parameters']['pathParam2']>;

export const stringsSchema = {
  name: 'Strings',
  example: ['str'],
  schema: {
    type: 'array',
    items: refersTo(stringSchema),
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Strings']>;

export const queryParamParameter = {
  name: 'queryParam',
  example: ['item1', 'item2'],
  parameter: {
    in: 'query',
    name: 'queryParam',
    required: true,
    description: 'A list of items',
    schema: refersTo(stringsSchema),
  },
} as const satisfies WhookAPIParameterDefinition<
  components['parameters']['queryParam']
>;

export const booleanSchema = {
  name: 'Boolean',
  example: true,
  schema: {
    type: 'boolean',
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Boolean']>;

export const numbersSchema = {
  name: 'Numbers',
  example: [1, 2, 3],
  schema: {
    type: 'array',
    items: refersTo(numberSchema),
  },
} as const satisfies WhookAPISchemaDefinition<components['schemas']['Numbers']>;

/* Architecture Note #3.4.2: getParameters

Here is a simple handler that just proxy the `TRANSACTIONS`
 service which contains the currently pending transactions.
*/
export const definition = {
  path: `/{${pathParam1Parameter.parameter.name}}/{${pathParam2Parameter.parameter.name}}`,
  method: 'get',
  operation: {
    operationId: 'getParameters',
    summary: 'An handler intended to test parameters.',
    tags: ['example'],
    parameters: [
      refersTo(pathParam1Parameter),
      refersTo(pathParam2Parameter),
      refersTo(queryParamParameter),
      {
        in: 'header',
        name: 'a-header',
        schema: refersTo(booleanSchema),
      },
      {
        in: 'header',
        name: 'aMultiHeader',
        schema: refersTo(numbersSchema),
      },
    ],
    responses: {
      200: {
        description: 'Delay expired',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                aHeader: refersTo(booleanSchema),
                aMultiHeader: {
                  type: 'array',
                  minItems: 2,
                  maxItems: 2,
                  prefixItems: [refersTo(numberSchema), refersTo(numberSchema)],
                },
                pathParam1: refersTo(numberSchema),
                pathParam2: refersTo(stringSchema),
                queryParam: refersTo(stringsSchema),
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetParameters() {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({
    headers: { 'a-header': aHeader, aMultiHeader } = {},
    path: { pathParam1, pathParam2 },
    query: { queryParam },
  }) => {
    return {
      status: 200,
      body: {
        aHeader,
        aMultiHeader: [aMultiHeader?.[0] || 0, aMultiHeader?.[0] || 0],
        pathParam1,
        pathParam2,
        queryParam,
      },
    };
  };

  return handler;
}

export default location(
  service(initGetParameters, definition.operation.operationId),
  import.meta.url,
);
