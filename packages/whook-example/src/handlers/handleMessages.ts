import { autoHandler } from 'knifecycle';
import type { LogService } from 'common-services';
import type { APIHandlerDefinition } from '../config/common/config';
import type {
  LambdaConsumerInput,
  LambdaConsumerOutput,
} from '@whook/aws-lambda';

export const definition: APIHandlerDefinition = {
  path: '/consumer/messages',
  method: 'post',
  operation: {
    operationId: 'handleMessages',
    summary: 'Handle queue messages.',
    tags: ['system'],
    'x-whook': {
      type: 'consumer',
      private: true,
      enabled: false,
    },
    responses: {
      200: {
        description: 'Batch handled',
      },
    },
  },
};

async function handleMessages(
  { log }: { log: LogService },
  { body }: LambdaConsumerInput,
): Promise<LambdaConsumerOutput> {
  log('info', `Received ${body.length} messages.`);
  log('debug', JSON.stringify(body));

  return {
    status: 200,
  };
}

export default autoHandler(handleMessages);
