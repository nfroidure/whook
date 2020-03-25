import {
  initPostGraphQL,
  postGraphQLDefinition as baseDefinition,
} from '@whook/graphql';

// Add authentication to the base postGraphQL endpoints that
// would otherwise be public per default
export const definition = {
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
