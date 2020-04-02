import { autoHandler } from 'knifecycle';
import type {
  WhookResponse,
  WhookAPIHandlerDefinition,
  WhookAPIParameterDefinition,
  WhookHandlerFunction,
} from '@whook/whook';
import type { DelayService } from 'common-services';

export const durationParameter: WhookAPIParameterDefinition = {
  name: 'duration',
  parameter: {
    in: 'query',
    name: 'duration',
    required: true,
    description: 'Duration in milliseconds',
    schema: {
      type: 'number',
    },
  },
};

export const definition: WhookAPIHandlerDefinition = {
  path: '/delay',
  method: 'get',
  operation: {
    operationId: 'getDelay',
    summary: 'Answer after a given delay.',
    tags: ['example'],
    parameters: [
      {
        $ref: `#/components/parameters/${durationParameter.name}`,
      },
    ],
    responses: {
      204: {
        description: 'Delay expired',
      },
    },
  },
};

async function getDelay(
  {
    delay,
  }: {
    delay: DelayService;
  },
  { duration }: { duration: number },
): Promise<WhookResponse<200, {}, undefined>> {
  await delay.create(duration);
  return {
    status: 200,
  };
}

export default autoHandler(getDelay);
