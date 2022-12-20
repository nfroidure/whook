import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { DEFAULT_COMPILER_OPTIONS, readArgs } from '@whook/whook';
import { encodePayload } from '../wrappers/awsLogSubscriberLambda.js';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCompilerOptions,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type {
  CloudWatchLogsDecodedData,
  CloudWatchLogsEvent,
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

export const definition: WhookCommandDefinition = {
  description: 'A command for testing AWS consumer lambda',
  example: `whook testS3Lambda --name handleS3Lambda`,
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
        description: 'The S3 actions batch event',
        type: 'string',
        default: JSON.stringify(DEFAULT_EVENT),
      },
    },
  },
};

export default extra(definition, autoService(initTestS3LambdaCommand));

async function initTestS3LambdaCommand({
  NODE_ENV,
  PROJECT_DIR,
  COMPILER_OPTIONS = DEFAULT_COMPILER_OPTIONS,
  log,
  args,
}: {
  NODE_ENV: string;
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
      { PROJECT_DIR, log },
      NODE_ENV,
      name,
      type,
      extension,
    );
    const parsedEvent: CloudWatchLogsEvent = {
      awslogs: {
        data: await encodePayload(JSON.parse(event)),
      },
    };
    const result = await new Promise((resolve, reject) => {
      const handlerPromise = handler(
        parsedEvent,
        {
          succeed: (...args: unknown[]) => {
            handlerPromise.then(resolve.bind(null, ...args));
          },
          fail: reject,
        },
        (err: Error, ...args: unknown[]) => {
          if (err) {
            reject(err);
            return;
          }
          handlerPromise.then(resolve.bind(null, ...args));
        },
      ).catch(reject);
    });

    log('info', 'SUCCESS:', result as string);
  };
}
