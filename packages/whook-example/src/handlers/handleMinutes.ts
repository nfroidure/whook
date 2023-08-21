import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import { type LambdaCronInput, type LambdaCronOutput } from '@whook/aws-lambda';
import {
  WhookAPIHandlerConfig,
  type WhookAPIHandlerDefinition,
  type WhookAPISchemaDefinition,
} from '@whook/whook';

// Here we create a schema for the cron body
// The `npm run watch` command automatically generate
// the typescript types
export const exampleSchema = {
  name: 'ExampleSchema',
  // Examples providen here are type checked ;)
  example: { foo: 'bar', bar: 'baz' },
  schema: {
    type: 'object',
    properties: {
      foo: { type: 'string' },
      bar: { type: 'string' },
    },
  },
} as const satisfies WhookAPISchemaDefinition<
  components['schemas']['ExampleSchema']
>;

// Passing in the types here
export const definition = {
  path: '/cron/minutes',
  method: 'post',
  // TODO: rethink this
  config: {
    type: 'cron',
    private: true,
    schedules: [
      {
        rule: '*/1 * * * *',
        // Bodies provided here are type checked ;)
        body: { foo: 'bar', bar: 'baz' },
        enabled: true,
      },
    ],
  } as unknown as WhookAPIHandlerConfig,
  operation: {
    operationId: 'handleMinutes',
    summary: 'Executes every minutes.',
    tags: ['system'],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${exampleSchema.name}` },
        },
      },
    },
    responses: {
      200: {
        description: 'Cron executed',
      },
    },
  },
} as const satisfies WhookAPIHandlerDefinition;

async function initHandleMinutes({ log }: { log: LogService }) {
  const handler = async ({
    date,
    body,
  }: LambdaCronInput<
    components['schemas']['ExampleSchema']
  >): Promise<LambdaCronOutput> => {
    log(
      'info',
      `Ran the cron at ${date}, with parameters (${JSON.stringify(body)}).`,
    );

    return {
      headers: {},
      status: 200,
    };
  };

  return handler;
}

export default autoService(initHandleMinutes);
