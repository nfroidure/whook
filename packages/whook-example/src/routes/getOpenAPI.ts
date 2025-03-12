import {
  initGetOpenAPI as baseInitGetOpenAPI,
  getOpenAPIDefinition as baseGetOpenAPIDefinition,
} from '@whook/whook';
import { service, location, useInject } from 'knifecycle';

/* Architecture Note #4: Serving the Open API

Whook provides a handler to serve the final Open API
 definition.

We could use the `WHOOK_PLUGINS` service to get the
 routes from plugins instead of proxying here, but
 we want to ensure the endpoint is reachable with
 a token too.

The fact that definitions are simple objects make them
 reusable and transformable easily. We could simply
 add new parameters or change the schema of the
 default definition of this endpoint.
*/
export const definition = {
  ...baseGetOpenAPIDefinition,
  operation: {
    ...baseGetOpenAPIDefinition.operation,
    security: [
      {},
      {
        bearerAuth: ['admin'],
      },
    ],
  },
};

export default location(
  useInject(
    baseInitGetOpenAPI,
    service(initGetOpenAPI, definition.operation.operationId),
  ),
  import.meta.url,
);

async function initGetOpenAPI(services) {
  const baseGetOpenAPI = await baseInitGetOpenAPI(services);

  const handler = async ({
    authenticated,
    ...parameters
  }: {
    authenticated: boolean;
  } & Omit<Parameters<typeof baseGetOpenAPI>[0], 'options'>) =>
    await baseGetOpenAPI({ ...parameters, options: { authenticated } });

  return handler;
}
