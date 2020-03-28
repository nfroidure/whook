import { autoHandler } from 'knifecycle';
import type { WhookResponse } from '@whook/whook';
import type { LogService } from 'common-services';
import type { APIHandlerDefinition } from '../config/common/config';

export const definition: APIHandlerDefinition = {
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
      disabled: false,
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
