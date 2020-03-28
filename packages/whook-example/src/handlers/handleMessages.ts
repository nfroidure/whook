import { autoHandler } from 'knifecycle';
import {
  WhookResponse,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookHandlerFunction,
} from '@whook/whook';
import { LogService, TimeService } from 'common-services';
import { WhookAWSLambdaBuildConfiguration } from '../commands/terraformValues';

export const definition: WhookAPIHandlerDefinition<WhookAWSLambdaBuildConfiguration> = {
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
