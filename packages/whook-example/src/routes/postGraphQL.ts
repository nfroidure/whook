import { type WhookRouteDefinition } from '@whook/whook';
import {
  initPostGraphQL,
  postGraphQLDefinition as baseDefinition,
} from '@whook/graphql';

// A trick to get Jest to work when having this message 🤷
// request for './handlers/getGraphQL.js' is not yet fulfilled
// import * as _ from './getGraphQL.js';

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
} as const as WhookRouteDefinition;

export default initPostGraphQL;
