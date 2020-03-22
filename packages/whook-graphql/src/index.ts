import initGetGraphQL, {
  definition as getGraphQLDefinition,
} from './handlers/getGraphQL';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './handlers/postGraphQL';
import initGraphQL, {
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
} from './services/graphql';

export {
  initGetGraphQL,
  getGraphQLDefinition,
  initPostGraphQL,
  postGraphQLDefinition,
  initGraphQL,
  WhookGraphQLConfig,
  WhookGraphQLDependencies,
  WhookGraphQLService,
  WhookGraphQLFragmentService,
};
