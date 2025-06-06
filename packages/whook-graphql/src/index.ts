import initGetGraphQL, {
  definition as getGraphQLDefinition,
} from './routes/getGraphQL.js';
import initPostGraphQL, {
  definition as postGraphQLDefinition,
} from './routes/postGraphQL.js';
import initGraphQL from './services/graphQL.js';
import { type WhookGraphQLContextFunction } from './routes/postGraphQL.js';
import {
  type WhookGraphQLEnv,
  type WhookGraphQLConfig,
  type WhookGraphQLDependencies,
  type WhookGraphQLService,
  type WhookGraphQLFragmentService,
  type WhookGraphQLContext,
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
