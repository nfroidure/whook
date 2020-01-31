import {
  initGetOpenAPI as getOpenAPI,
  getOpenAPIDefinition as baseGetOpenAPIDefinition,
} from '@whook/swagger-ui';

// TODO: Use WHOOK_PLUGINS to get handlers from plugins
// instead of proxying here

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
