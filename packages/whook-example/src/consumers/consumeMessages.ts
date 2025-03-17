import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import { type WhookAWSLambdaConsumerInput } from '@whook/aws-lambda';
import {
  type WhookConsumerHandler,
  type WhookConsumerDefinition,
} from '@whook/whook';
import { type Jsonify } from 'type-fest';

export const definition = {
  name: 'consumeMessages',
  schema: { type: 'object' },
} as const satisfies WhookConsumerDefinition;

async function initConsumeMessages({ log }: { log: LogService }) {
  const handler = (async ({ body }: WhookAWSLambdaConsumerInput) => {
    log('info', `Received ${body.length} messages.`);
    log('debug', JSON.stringify(body));
  }) satisfies WhookConsumerHandler<Jsonify<WhookAWSLambdaConsumerInput>>;

  return handler;
}

export default autoService(initConsumeMessages);
