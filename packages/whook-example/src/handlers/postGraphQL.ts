import {
  initPostGraphQL,
  postGraphQLDefinition as baseDefinition,
} from '@whook/graphql';
import type { WhookAPIHandlerDefinition } from '@whook/whook';

// Add authentication to the base postGraphQL endpoints that
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

export default initPostGraphQL;
