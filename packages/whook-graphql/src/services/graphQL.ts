import { autoProvider } from 'knifecycle';
import { noop, WhookOperation } from '@whook/whook';
import { ApolloServer } from '@apollo/server';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { Provider } from 'knifecycle';
import type { LogService } from 'common-services';
import type { ApolloServerOptions } from '@apollo/server';
import type { GraphQLSchema, DocumentNode } from 'graphql';

type ElementOf<A> = A extends (infer T)[] ? T : never;
type IResolvers = ElementOf<
  ApolloServerOptions<WhookGraphQLContext>['resolvers']
>;
type DirectiveTransformer = (
  schema: GraphQLSchema,
  directiveName: string,
) => GraphQLSchema;

export type WhookGraphQLFragmentService = {
  typeDefs: DocumentNode | DocumentNode[];
  resolvers?: IResolvers;
  schemaDirectives?: Record<string, DirectiveTransformer>;
};

export type BaseWhookGraphQLContext = {
  operation: WhookOperation;
  requestContext: Record<string, unknown>;
};

export type WhookGraphQLContext = BaseWhookGraphQLContext;

export type WhookGraphQLEnv = {
  DEV_MODE?: string;
};
export type WhookGraphQLConfig = {
  GRAPHQL_SERVER_OPTIONS?: Partial<ApolloServerOptions<WhookGraphQLContext>>;
};
export type WhookGraphQLService = ApolloServer<WhookGraphQLContext>;

export type WhookGraphQLDependencies = WhookGraphQLConfig & {
  ENV: WhookGraphQLEnv;
  graphQLFragments: WhookGraphQLFragmentService[];
  log: LogService;
};

export default autoProvider(initGraphQL);

/**
 * Initialize the GraphQL service
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Object|Function}   [services.GRAPHQL_SERVER_OPTIONS]
 * The GraphQL options to pass to the server
 * @param  {String}   ENV
 * The process environment
 * @param  {String}   [graphQLFragments]
 * Fragments of GraphQL schemas/resolvers declaration
 * @param  {Function} [services.log=noop]
 * A logging function
 * @param  {Function} [services.time]
 * A function returning the current timestamp
 * @return {Promise}
 * A promise of a GraphQL service
 */
async function initGraphQL({
  GRAPHQL_SERVER_OPTIONS,
  ENV,
  graphQLFragments,
  log = noop,
}: WhookGraphQLDependencies): Promise<Provider<WhookGraphQLService>> {
  GRAPHQL_SERVER_OPTIONS = GRAPHQL_SERVER_OPTIONS || {};
  graphQLFragments = graphQLFragments || [];

  // Gather fragments
  const baseResolvers = GRAPHQL_SERVER_OPTIONS.resolvers
    ? GRAPHQL_SERVER_OPTIONS.resolvers instanceof Array
      ? (GRAPHQL_SERVER_OPTIONS.resolvers as IResolvers[])
      : [GRAPHQL_SERVER_OPTIONS.resolvers as IResolvers]
    : [];
  const baseTypeDefs = GRAPHQL_SERVER_OPTIONS.typeDefs
    ? GRAPHQL_SERVER_OPTIONS.typeDefs instanceof Array
      ? (GRAPHQL_SERVER_OPTIONS.typeDefs as DocumentNode[])
      : [GRAPHQL_SERVER_OPTIONS.typeDefs as DocumentNode]
    : [];
  const directives = graphQLFragments.reduce(
    (accSchemaDirectives, { schemaDirectives }) => ({
      ...accSchemaDirectives,
      ...schemaDirectives,
    }),
    {},
  );

  const apolloServer = new ApolloServer({
    includeStacktraceInErrorResponses:
      GRAPHQL_SERVER_OPTIONS.includeStacktraceInErrorResponses ||
      !!ENV.DEV_MODE,
    introspection: GRAPHQL_SERVER_OPTIONS.introspection || !!ENV.DEV_MODE,
    stopOnTerminationSignals: false, // Handled by Whook
    ...GRAPHQL_SERVER_OPTIONS,
    schema: Object.keys(directives).reduce(
      (finalSchema, name) => directives[name](finalSchema, name),
      makeExecutableSchema({
        typeDefs: graphQLFragments.reduce(
          (accTypeDefs, { typeDefs }) => [
            ...accTypeDefs,
            ...([] as DocumentNode[]).concat(typeDefs),
          ],
          baseTypeDefs,
        ),
        resolvers: graphQLFragments
          .map(({ resolvers }) => resolvers)
          .reduce(
            (accResolvers, resolvers) => [
              ...accResolvers,
              ...([] as IResolvers[]).concat(resolvers || []),
            ],
            baseResolvers,
          ),
      }),
    ),
  } as ApolloServerOptions<WhookGraphQLContext>);

  await apolloServer.start();

  log('debug', '🕸️ - Initializing the GraphQL Service');

  return {
    service: apolloServer,
    dispose: async () => {
      log('debug', '🕸️ - Stopping the GraphQL Service');
      await apolloServer.stop();
    },
  };
}
