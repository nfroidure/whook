import { autoService } from 'knifecycle';
import { type LogService } from 'common-services';
import {
  type LambdaConsumerInput,
  type LambdaConsumerOutput,
} from '@whook/aws-lambda';
import { type WhookAPIHandlerDefinition } from '@whook/whook';

export const definition = {
  path: '/consumer/messages',
  method: 'post',
  config: {
    type: 'consumer',
    private: true,
  },
  operation: {
    operationId: 'handleMessages',
    summary: 'Handle queue messages.',
    tags: ['system'],
    responses: {
      200: {
        description: 'Batch handled',
      },
    },
  },
} as const satisfies WhookAPIHandlerDefinition;

async function initHandleMessages({ log }: { log: LogService }) {
  const handler = async ({
    body,
  }: LambdaConsumerInput): Promise<LambdaConsumerOutput> => {
    log('info', `Received ${body.length} messages.`);
    log('debug', JSON.stringify(body));

    return {
      headers: {},
      status: 200,
    };
  };

  return handler;
}

export default autoService(initHandleMessages);
