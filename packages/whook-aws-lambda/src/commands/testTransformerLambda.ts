import { loadLambda } from '../libs/utils.js';
import { extra, autoService } from 'knifecycle';
import { readArgs } from '@whook/cli';
import { DEFAULT_COMPILER_OPTIONS } from '@whook/whook';
import type { WhookCompilerOptions } from '@whook/whook';
import type { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
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
