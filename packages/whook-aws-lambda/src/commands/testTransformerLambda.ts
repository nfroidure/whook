import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { DEFAULT_COMPILER_OPTIONS, readArgs } from '@whook/whook';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCompilerOptions,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type { FirehoseTransformationEvent } from 'aws-lambda';

const DEFAULT_EVENT: FirehoseTransformationEvent = {
  invocationId: 'xxxx',
  deliveryStreamArn: 'aws:xx:xx:xx',
  region: 'eu-west-3',
  records: [
    {
      recordId: 'xxxxxxxxxxxxxxxxx',
      approximateArrivalTimestamp: Date.parse('2010-03-06T00:00:00Z'),
      data: Buffer.from(JSON.stringify({ some: 'data' })).toString('base64'),
    },
  ],
};

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS lambda transformers',
  example: `whook TransformerLambda --name handleTransformerLambda`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['name'],
    properties: {
      name: {
        description: 'Name of the lambda to run',
        type: 'string',
      },
      type: {
        description: 'Type of lambda to test',
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
      event: {
        description: 'The stream event',
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  },
};

export default extra(definition, autoService(initTestTransformerLambdaCommand));

async function initTestTransformerLambdaCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
  args,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  log: LogService;
  args: WhookCommandArgs;
}) {
  return async () => {
    const {
      namedArguments: { name, type, event },
    } = readArgs<{
      name: string;
      type: string;
      event: string;
    }>(definition.arguments, args);
    const extension = COMPILER_OPTIONS.format === 'cjs' ? '.cjs' : '.mjs';
    const handler = await loadLambda(
      { APP_ENV, PROJECT_DIR, log },
      name,
      type,
      extension,
    );
    const parsedEvent = JSON.parse(event);
    const result = await handler(parsedEvent, {});

    log('info', 'SUCCESS:', result as string);

    process.emit('SIGTERM');
  };
}
