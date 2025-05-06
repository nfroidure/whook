import { autoService } from 'knifecycle';
import {
  refersTo,
  type WhookRouteTypedHandler,
  type WhookAPIParameterDefinition,
  type WhookAPICallbackDefinition,
} from '@whook/whook';
import { type LogService, type DelayService } from 'common-services';
import { type WhookRouteDefinition } from '@whook/whook';

/* Architecture Note #3.4: Examples

The default Whook project contains a few sample
 routes to help you grasp its principles.

You can keep some or just delete them and create
 yours with `npm run dev -- create`.
*/

/* Architecture Note #3.1.2: Reusable parameters

This is how to declare a reusable API parameter
 to avoid having to write it several times and
 lower your final Open API file weight.
*/
export const durationParameter = {
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
} as const satisfies WhookAPIParameterDefinition<
  components['parameters']['duration']
>;

/* Architecture Note #3.1.5: Reusable callbacks

This is how to declare a reusable API callback.

Callbacks get typed too allowing you to ensure
 your code fits the required API signature.
*/
export const delayCallback = {
  name: 'DelayCallback',
  callback: {
    '{$request.query.callbackUrl}': {
      post: {
        operationId: 'postDelayCallback',
        parameters: [refersTo(durationParameter)],
        responses: {
          204: {
            description: 'Delay trigger received.',
          },
        },
      },
    },
  },
} as const satisfies WhookAPICallbackDefinition;

/* Architecture Note #3.1: Definition

This is how to declare a new route for your API.
 The syntax is pure [Open API](https://www.openapis.org/),
 the types are automatically generated with the `npm run watch`
 command.

For it to work, you have to export the definition, like
 here, to make it available for the API service, responsible
 for gathering all API route definitions.
*/
export const definition = {
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
      refersTo(durationParameter),
      {
        name: 'callbackUrl',
        in: 'query',
        schema: {
          type: 'string',
          format: 'uri',
        },
      },
    ],
    responses: {
      204: {
        description: 'Delay expired',
      },
    },
    callbacks: {
      DelayCallback: refersTo(delayCallback),
    },
  },
} as const satisfies WhookRouteDefinition;

/* Architecture Note #3.2: Implementation

The handler implementation is here, you can notice
 the Input/Output types that were automatically generated
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
async function initGetDelay({
  delay,
  fetcher = fetch,
  log,
}: {
  delay: DelayService;
  fetcher?: typeof fetch;
  log: LogService;
}) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({ query: { duration, callbackUrl } }) => {
    await delay.create(duration);

    if (callbackUrl) {
      const url = buildDelayCallbackURL(callbackUrl, { query: { duration } });
      const response = await fetcher(url, { method: 'POST' });

      if (response.status !== 204) {
        log('error', '💥 - Bad callback response!');
      }
    }

    /* Architecture Note #3.2.1: Response

  The handler's response are simple JSON serializable
   objects with a `status` and optional `body` and
   `headers` properties.
  */
    return {
      status: 204,
    };
  };

  return handler;
}

function buildDelayCallbackURL(
  callbackURL: string,
  input: operations['postDelayCallback']['parameters'],
) {
  const url = new URL(callbackURL);

  url.searchParams.set('duration', input.query.duration.toString());
  return url.toString();
}

/* Architecture Note #3.2.2: Exportation

Here we simply tag the handler function as
 an handler Whook's will be able to use.

There is some magic here with the use of
 dependency injection with `Knifecycle`.

You can read more about it
 [here](https://github.com/nfroidure/knifecycle).
*/
export default autoService(initGetDelay);
