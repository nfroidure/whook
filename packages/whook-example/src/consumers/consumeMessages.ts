import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import { type WhookAWSLambdaConsumerInput } from '@whook/aws-lambda';
import {
  type WhookConsumerHandler,
  type WhookConsumerDefinition,
} from '@whook/whook';

export const definition = {
  name: 'consumeMessages',
  schema: { type: 'object' },
} as const satisfies WhookConsumerDefinition;

async function initHandleMessages({ log }: { log: LogService }) {
  const handler: WhookConsumerHandler<WhookAWSLambdaConsumerInput> = async ({
    body,
  }) => {
    log('info', `Received ${body.length} messages.`);
    log('debug', JSON.stringify(body));
  };

  return handler;
}

export default autoService(initHandleMessages);
