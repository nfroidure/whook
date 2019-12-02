import { autoHandler } from 'knifecycle';
import { WhookResponse, WhookDefinition } from '@whook/whook';
import { DelayService } from 'common-services';

export const definition: WhookDefinition = {
  path: '/delay',
  method: 'get',
  operation: {
    operationId: 'getDelay',
    summary: 'Answer after a given delay.',
    tags: ['system'],
    parameters: [
      {
        in: 'query',
        name: 'duration',
        required: true,
        description: 'Duration in milliseconds',
        schema: {
          type: 'number',
        },
      },
    ],
    responses: {
      204: {
        description: 'Delay expired',
      },
    },
  },
};

export default autoHandler(getDelay);

async function getDelay(
  { delay }: { delay: DelayService },
  { duration }: { duration: number },
): Promise<WhookResponse> {
  await delay.create(duration);
  return {
    status: 200,
  };
}
