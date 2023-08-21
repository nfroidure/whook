import { autoHandler } from 'knifecycle';
import type { LogService } from 'common-services';
import type { LambdaCronInput, LambdaCronOutput } from '@whook/aws-lambda';
import type {
  WhookAPIHandlerDefinition,
  WhookAPISchemaDefinition,
} from '@whook/whook';

// Here we create a schema for the cron body
// The `npm run watch` command automatically generate
// the typescript types
export const exampleSchema: WhookAPISchemaDefinition<Components.Schemas.ExampleSchema> =
  {
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
  };

// Passing in the types here
export const definition: WhookAPIHandlerDefinition<Components.Schemas.ExampleSchema> =
  {
    path: '/cron/minutes',
    method: 'post',
    operation: {
      operationId: 'handleMinutes',
      summary: 'Executes every minutes.',
      tags: ['system'],
      'x-whook': {
        type: 'cron',
        private: true,
        schedules: [
          {
            rule: '*/1 * * * *',
            // Bodies providen here are type checked ;)
            body: { foo: 'bar', bar: 'baz' },
            enabled: true,
          },
        ],
      },
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
  };

async function handleMinutes(
  { log }: { log: LogService },
  { date, body }: LambdaCronInput<Components.Schemas.ExampleSchema>,
): Promise<LambdaCronOutput> {
  log(
    'info',
    `Ran the cron at ${date}, with parameters (${JSON.stringify(body)}).`,
  );

  return {
    headers: {},
    status: 200,
  };
}

export default autoHandler(handleMinutes);
