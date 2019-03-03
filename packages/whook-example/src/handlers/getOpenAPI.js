import getOpenAPI, {
  definition as baseGetOpenAPIDefinition,
} from '@whook/swagger-ui/dist/handlers/getOpenAPI';

// TODO: Use WHOOK_PLUGINS to get handlers from plugins
// instead of proxying here

export const definition = {
  ...baseGetOpenAPIDefinition,
  operation: {
    ...baseGetOpenAPIDefinition.operation,
    parameters: [
      ...(baseGetOpenAPIDefinition.operation.parameters || []),
      {
        in: 'header',
        name: 'authorization',
        schema: {
          type: 'string',
        },
      },
      {
        in: 'query',
        name: 'access_token',
        schema: {
          type: 'string',
        },
      },
    ],
  },
};
export default getOpenAPI;
