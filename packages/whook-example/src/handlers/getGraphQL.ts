import { type WhookAPIHandlerDefinition } from '@whook/whook';
import {
  initGetGraphQL,
  getGraphQLDefinition as baseDefinition,
} from '@whook/graphql';

// Add authentication to the base getGraphQL endpoints that
// would otherwise be public per default
export const definition: WhookAPIHandlerDefinition = {
  ...baseDefinition,
  operation: {
    ...baseDefinition.operation,
    security: [
      {
        bearerAuth: ['admin'],
      },
    ],
  },
};

export default initGetGraphQL;
