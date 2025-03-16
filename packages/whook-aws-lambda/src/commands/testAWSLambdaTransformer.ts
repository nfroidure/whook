import { loadLambda } from '../libs/utils.js';
import { location, autoService } from 'knifecycle';
import {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService } from 'common-services';
import { type FirehoseTransformationEvent } from 'aws-lambda';

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

export const definition = {
  name: 'testAWSLambdaTransformer',
  description: 'A command for testing AWS lambda transformers',
  example: `whook testAWSLambdaTransformer --name handleTransformerLambda`,
  arguments: [
    {
      name: 'name',
      required: true,
      description: 'Name of the lambda to run',
      schema: {
        type: 'string',
      },
    },
    {
      name: 'type',
      description: 'Type of lambda to test',
      schema: {
        type: 'string',
        enum: ['main', 'index'],
        default: 'index',
      },
    },
    {
      name: 'event',
      description: 'The stream event',
      schema: {
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initTestAWSLambdaTransformerCommand({
  APP_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
}: {
  APP_ENV: string;
  PROJECT_DIR: string;
  COMPILER_OPTIONS?: WhookCompilerOptions;
  log: LogService;
}): Promise<
  WhookCommandHandler<{
    name: string;
    type: string;
    event: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { name, type, event },
    } = args;
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

export default location(
  autoService(initTestAWSLambdaTransformerCommand),
  import.meta.url,
);
