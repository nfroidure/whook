import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { DEFAULT_COMPILER_OPTIONS, readArgs } from '@whook/whook';
import type {
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCompilerOptions,
} from '@whook/whook';
import type { LogService } from 'common-services';
import type { S3Event } from 'aws-lambda';

// Event example from:
// https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html
const DEFAULT_EVENT: S3Event = {
  Records: [
    {
      eventVersion: '2.1',
      eventSource: 'aws:s3',
      awsRegion: 'us-east-2',
      eventTime: '2019-09-03T19:37:27.192Z',
      eventName: 'ObjectCreated:Put',
      userIdentity: {
        principalId: 'AWS:AIDAINPONIXQXHT3IKHL2',
      },
      requestParameters: {
        sourceIPAddress: '205.255.255.255',
      },
      responseElements: {
        'x-amz-request-id': 'D82B88E5F771F645',
        'x-amz-id-2':
          'vlR7PnpV2Ce81l0PRw6jlUpck7Jo5ZsQjryTjKlc5aLWGVHPZLj5NeC6qMa0emYBDXOo6QBU0Wo=',
      },
      s3: {
        s3SchemaVersion: '1.0',
        configurationId: '828aa6fc-f7b5-4305-8584-487c791949c1',
        bucket: {
          name: 'lambda-artifacts-deafc19498e3f2df',
          ownerIdentity: {
            principalId: 'A3I5XTEXAMAI3E',
          },
          arn: 'arn:aws:s3:::lambda-artifacts-deafc19498e3f2df',
        },
        object: {
          key: 'b21b84d653bb07b05b1e6b33684dc11b',
          size: 1305107,
          eTag: 'b21b84d653bb07b05b1e6b33684dc11b',
          sequencer: '0C0F6F405D6ED209E1',
        },
      },
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
    const parsedEvent = JSON.parse(event);
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
