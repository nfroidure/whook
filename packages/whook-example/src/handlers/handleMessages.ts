import { autoHandler } from 'knifecycle';
import type { WhookResponse } from '@whook/whook';
import type { LogService } from 'common-services';
import type { APIHandlerDefinition } from '../config/common/config';

export const definition = {
  path: '/consumer/messages',
  method: 'post',
  operation: {
    operationId: 'handleMessages',
    summary: 'Handle queue messages.',
    tags: ['system'],
    'x-whook': {
      type: 'consumer',
      private: true,
      disabled: false,
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
  {
    body,
  }: {
    body: any;
  },
): Promise<WhookResponse<200, {}, undefined>> {
  log('info', `Received a message ${JSON.stringify(body)} messages.`);

  return {
    status: 200,
  };
}

export default autoHandler(handleMessages);
