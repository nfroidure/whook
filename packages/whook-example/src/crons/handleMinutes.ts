import { autoService } from 'knifecycle';
import { type DelayService, type LogService } from 'common-services';
import {
  type WhookCronDefinition,
  type WhookAPISchemaDefinition,
  type WhookCronHandler,
} from '@whook/whook';

// Here we create a schema for the cron body
// The `npm run watch` command automatically generate
// the typescript types
export const exampleSchema = {
  name: 'ExampleSchema',
  // Examples provided here are type checked ;)
  example: { message: 'This is message to log', delay: 1 },
  schema: {
    type: 'object',
    required: ['message', 'delay'],
    properties: {
      message: { type: 'string' },
      delay: { type: 'number' },
    },
  },
} as const satisfies WhookAPISchemaDefinition<
  components['schemas']['ExampleSchema']
>;

export const definition = {
  name: 'handleMinutes',
  schedules: [
    {
      rule: '*/1 * * * *',
      // Bodies provided here are type checked ;)
      body: { message: 'A minute starts!', delay: 10000 },
      environments: ['local'],
    },
  ],
  schema: { $ref: `#/components/schemas/${exampleSchema.name}` },
  config: {
    environments: 'all',
  },
} as const satisfies WhookCronDefinition<
  components['schemas']['ExampleSchema']
>;

async function initHandleMinutes({
  delay,
  log,
}: {
  delay: DelayService;
  log: LogService;
}) {
  const handler: WhookCronHandler<
    components['schemas']['ExampleSchema']
  > = async ({ date, body }) => {
    await delay.create(body.delay || 1);

    log(
      'info',
      `⌚ - Ran the cron at ${date}, with parameters (${JSON.stringify(body)}).`,
    );
  };

  return handler;
}

export default autoService(initHandleMinutes);
