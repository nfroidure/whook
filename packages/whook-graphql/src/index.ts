import initGetGraphQL, {
  definition as getGraphQLDefinition,
} from './handlers/getGraphQL';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './handlers/postGraphQL';
import initGraphQL, {
  WhookGraphQLEnv,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
} from './services/graphQL';

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
