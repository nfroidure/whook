import { autoService } from 'knifecycle';
import { noop } from '@whook/whook';
import { ApolloServerBase, gql } from 'apollo-server-core';
import type { WhookOperation } from '@whook/whook';
import type { LogService } from 'common-services';
import type { Config, GraphQLOptions } from 'apollo-server-core';

type DocumentNode = ReturnType<typeof gql>;
type ElementOf<A> = A extends (infer T)[] ? T : never;
type IResolvers = ElementOf<Config['resolvers']>;
type ApolloServerOptions = Config;

export type WhookGraphQLFragmentService = {
  typeDefs: DocumentNode | DocumentNode[];
  resolvers?: IResolvers;
  schemaDirectives?: ApolloServerOptions['schemaDirectives'];
};

export type WhookGraphQLEnv = {
  DEV_MODE: string;
};
export type WhookGraphQLConfig = {
  GRAPHQL_SERVER_OPTIONS?: Config;
};

export type WhookGraphQLDependencies = WhookGraphQLConfig & {
  ENV: WhookGraphQLEnv;
  graphQLFragments: WhookGraphQLFragmentService[];
  log: LogService;
};

export class WhookGraphQLService extends ApolloServerBase {
  // If you feel tempted to add an option to this constructor. Please consider
  // another place, since the documentation becomes much more complicated when
  // the constructor is not longer shared between all integration
  constructor(options: Config) {
    if (process.env.ENGINE_API_KEY || options.engine) {
      options.engine = {
        sendReportsImmediately: true,
        ...(typeof options.engine !== 'boolean' ? options.engine : {}),
      };
    }
    super(options);
  }

  async waitStart(): Promise<void> {
    await super.willStart();
  }

  // This translates the arguments from the middleware into graphQL options It
  // provides typings for the integration specific behavior, ideally this would
  // be propagated with a generic to the super class
  createGraphQLServerOptions<U>({
    operation,
    requestContext,
  }: {
    operation: WhookOperation;
    requestContext: U;
  }): Promise<GraphQLOptions> {
    return super.graphQLServerOptions({ operation, requestContext });
  }
}

export default autoService(initGraphQL);

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
}: WhookGraphQLDependencies): Promise<WhookGraphQLService> {
  GRAPHQL_SERVER_OPTIONS = GRAPHQL_SERVER_OPTIONS || {};
  graphQLFragments = graphQLFragments || [];

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
  const apolloServer = new WhookGraphQLService({
    ...GRAPHQL_SERVER_OPTIONS,
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
    schemaDirectives: graphQLFragments.reduce(
      (accSchemaDirectives, { schemaDirectives }) => ({
        ...accSchemaDirectives,
        ...schemaDirectives,
      }),
      GRAPHQL_SERVER_OPTIONS.schemaDirectives,
    ),
    introspection: GRAPHQL_SERVER_OPTIONS.introspection || !!ENV.DEV_MODE,
  });

  await apolloServer.waitStart();

  log('debug', '🕸️ - Initializing the GraphQL Service');

  return apolloServer;
}
