import {
  initGetOpenAPI as getOpenAPI,
  getOpenAPIDefinition as baseGetOpenAPIDefinition,
} from '@whook/swagger-ui';

/* Architecture Note #4: Serving the Open API

Whook provides a handler to serve the final Open API
 definition.

We could use the `WHOOK_PLUGINS` service to get the
 handlers from plugins instead of proxying here, but
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
    parameters: [...(baseGetOpenAPIDefinition.operation.parameters || [])],
  },
};
export default getOpenAPI;
