import {
  initGetOpenAPI as getOpenAPI,
  getOpenAPIDefinition as baseGetOpenAPIDefinition,
} from '@whook/swagger-ui';

// We could use WHOOK_PLUGINS to get handlers from plugins
//  instead of proxying here, but we want to ensure the
//  endpoint is reachable with a token too

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
