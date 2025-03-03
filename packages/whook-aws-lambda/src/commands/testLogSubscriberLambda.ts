import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { encodePayload } from '../wrappers/awsLogSubscriberLambda.js';
import {
  DEFAULT_COMPILER_OPTIONS,
  type WhookCommand,
  type WhookCommandDefinition,
  type WhookCompilerOptions,
} from '@whook/whook';
import { type LogService } from 'common-services';
import {
  type CloudWatchLogsDecodedData,
  type CloudWatchLogsEvent,
} from 'aws-lambda';

// Event example from:
// https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchlogs.html
const DEFAULT_EVENT: CloudWatchLogsDecodedData = {
  messageType: 'DATA_MESSAGE',
  owner: '123456789012',
  logGroup: '/aws/lambda/echo-nodejs',
  logStream: '2019/03/13/[$LATEST]94fa867e5374431291a7fc14e2f56ae7',
  subscriptionFilters: ['LambdaStream_cloudwatchlogs-node'],
  logEvents: [
    {
      id: '34622316099697884706540976068822859012661220141643892546',
      timestamp: 1552518348220,
      message:
        'REPORT RequestId: 6234bffe-149a-b642-81ff-2e8e376d8aff\tDuration: 46.84 ms\tBilled Duration: 47 ms \tMemory Size: 192 MB\tMax Memory Used: 72 MB\t\n',
    },
  ],
};

export const definition = {
  name: '',
  description: 'A command for testing AWS consumer lambda',
  example: `whook testLogSubscriberLambda --name handleS3Lambda`,
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
      description: 'The S3 actions batch event',
      schema: {
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

export default extra(definition, autoService(initTestS3LambdaCommand));

async function initTestS3LambdaCommand({
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
  WhookCommand<{
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
      {
        APP_ENV,
        PROJECT_DIR,
        log,
      },
      name,
      type,
      extension,
    );
    const parsedEvent: CloudWatchLogsEvent = {
      awslogs: {
        data: await encodePayload(JSON.parse(event)),
      },
    };
    const result = await handler(parsedEvent, {});

    log('info', 'SUCCESS:', result as string);

    process.emit('SIGTERM');
  };
}
