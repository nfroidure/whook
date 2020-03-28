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
  path: '/cron/minutes',
  method: 'post',
  operation: {
    operationId: 'handleMinutes',
    summary: 'Executes every minutes.',
    tags: ['system'],
    'x-whook': {
      type: 'cron',
      private: true,
      schedule: '*/1 * * * *',
      enabled: false,
    },
    responses: {
      200: {
        description: 'Cron executed',
      },
    },
  },
};

async function handleMinutes(
  { log }: { log: LogService },
  {
    date,
  }: {
    date: string;
  },
): Promise<WhookResponse<200, {}, undefined>> {
  log('info', `Ran the cron at ${date}.`);

  return {
    status: 200,
  };
}

export default autoHandler(handleMinutes);
