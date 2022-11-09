import initGetGraphQL, {
  definition as getGraphQLDefinition,
} from './handlers/getGraphQL.js';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './handlers/postGraphQL.js';
import initGraphQL from './services/graphQL.js';
import type { WhookGraphQLContextFunction } from './handlers/postGraphQL.js';
import type {
  WhookGraphQLEnv,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
  WhookGraphQLContext,
} from './services/graphQL.js';

export type {
  WhookGraphQLEnv,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
  WhookGraphQLContext,
  WhookGraphQLContextFunction,
};
export {
  initGetGraphQL,
  getGraphQLDefinition,
  initPostGraphQL,
  postGraphQLDefinition,
  initGraphQL,
};
