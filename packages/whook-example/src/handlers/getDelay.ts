import { autoHandler } from 'knifecycle';
import type { WhookAPIParameterDefinition } from '@whook/whook';
import type { APIHandlerDefinition } from '../config/common/config';
import type { DelayService } from 'common-services';

/* Architecture Note #3.4: Examples

The default Whook project contains a few sample
 handlers to help you grasp its principles.

You can keep some or just delete them and create
 yours with `npm run whook-dev -- create`.
*/

/* Architecture Note #3.1.2: Reusable parameters

This is how to declare a reusable API parameter
 to avoid having to write it several times and
 lower your final Open API file weight.
*/
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

/* Architecture Note #3.1: Definition

This is how to declare a new route for your API.
 The syntax is pure [Open API](https://www.openapis.org/),
 the types are automatically generated with the `npm run watch`
 command.

For it to work, you have to export the definition, like
 here, to make it available for the API service, responsible
 for gathering all API route definitions.
*/
export const definition: APIHandlerDefinition = {
  path: '/delay',
  method: 'get',
  operation: {
    /* Architecture Note #3.1.1: Operation ID

    The name provided as the Open API `operationId` here
    must map the handler name to link the definition
    to it (here `getDelay`).
    */
    operationId: 'getDelay',
    summary: 'Answer after a given delay.',
    tags: ['example'],
    parameters: [
      /* Architecture Note #3.1.2.1: Usage

      To use reusable parameters, you must refer to it
       instead of writing it inline.
      */
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

/* Architecture Note #3.2: Implementation

The handler implementation is here, you can notice
 the Input/Ouput types that were automatically generated
 to help you keep definitions and code in sync.

Handlers implementations take dependencies as the first
 argument and parameters in the second.

Dependencies are injected by Whook on-demand based
 on their name.

Parameters are cleaned up and checked by Whook so
 that you just have to use the values according
 to the API contract you set in the handler's
 Open API definition above.
*/
async function getDelay(
  {
    delay,
  }: {
    delay: DelayService;
  },
  { duration }: API.GetDelay.Input,
): Promise<API.GetDelay.Output> {
  await delay.create(duration);

  /* Architecture Note #3.2.1: Response

  The handler's response are simple JSON serializable
   objects with a `status` and optional `body` and
   `headers` properties.
  */
  return {
    status: 200,
  };
}

/* Architecture Note #3.2.2: Exportation

Here we simply tag the handler function as
 an handler Whook's will be able to use.

There is some magic here with the use of
 dependency injection with `Knifecycle`.

You can read more about it
 [here](https://github.com/nfroidure/knifecycle).
*/
export default autoHandler(getDelay);
