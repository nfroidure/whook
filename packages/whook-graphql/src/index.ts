import initGetGraphQL, {
  definition as getGraphQLDefinition,
} from './handlers/getGraphQL.js';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './handlers/postGraphQL.js';
import initGraphQL, {
  WhookGraphQLEnv,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
} from './services/graphQL.js';

export type {
  WhookGraphQLEnv,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
};
export {
  initGetGraphQL,
  getGraphQLDefinition,
  initPostGraphQL,
  postGraphQLDefinition,
  initGraphQL,
};
