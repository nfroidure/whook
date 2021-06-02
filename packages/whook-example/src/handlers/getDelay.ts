import { autoHandler } from 'knifecycle';
import type { WhookAPIParameterDefinition } from '@whook/whook';
import type { APIHandlerDefinition } from '../config/common/config';
import type { DelayService } from 'common-services';

export const durationParameter: WhookAPIParameterDefinition<API.GetDelay.Parameters.Duration> =
  {
    name: 'duration',
    example: 1,
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

export const definition: APIHandlerDefinition = {
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
  { duration }: API.GetDelay.Input,
): Promise<API.GetDelay.Output> {
  await delay.create(duration);
  return {
    status: 200,
  };
}

export default autoHandler(getDelay);
