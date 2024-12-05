import {
  initPostGraphQL,
  postGraphQLDefinition as baseDefinition,
} from '@whook/graphql';
import type { WhookAPIHandlerDefinition } from '@whook/whook';

// A trick to get Jest to work when having this message 🤷
// request for './handlers/getGraphQL.js' is not yet fulfilled
// import * as _ from './getGraphQL.js';

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
