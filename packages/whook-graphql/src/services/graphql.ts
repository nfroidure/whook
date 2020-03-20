import { autoService } from 'knifecycle';
import YError from 'yerror';
import { noop, WhookOperation } from '@whook/whook';
import { LogService } from 'common-services';
import {
  ApolloServerBase,
  GraphQLOptions,
  Config,
  runHttpQuery,
} from 'apollo-server-core';
import { Headers } from 'apollo-server-env';

type ElementOf<A> = A extends (infer T)[] ? T : never;
type IResolvers = ElementOf<Config['resolvers']>;
type ApolloServerOptions = ConstructorParameters<typeof ApolloServer>[0];
type GraphQLParseOptions = ApolloServerOptions['parseOptions'];
type HttpQueryRequestQuery = Parameters<typeof runHttpQuery>[1]['query'];

export type WhookGraphQLFragmentService = {
  typeDefs: Config['typeDefs'];
  resolvers?: IResolvers;
  schemaDirectives?: ApolloServerOptions['schemaDirectives'];
};

export type WhookGraphQLConfig = {
  GRAPHQL_OPTIONS?: {
    parseOptions?: GraphQLParseOptions;
  };
};

export type WhookGraphQLDependencies = WhookGraphQLConfig & {
  ENV: {
    DEV_MODE: string;
  };
  graphQLFragments: WhookGraphQLFragmentService[];
  log: LogService;
};

export type WhookGraphQLService = {
  query({
    context: any,
    operation: WhookOperation,
    query: HttpQueryRequestQuery,
  }): ReturnType<typeof runHttpQuery>;
};

class ApolloServer extends ApolloServerBase {
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

  async waitStart() {
    await super.willStart();
  }

  // This translates the arguments from the middleware into graphQL options It
  // provides typings for the integration specific behavior, ideally this would
  // be propagated with a generic to the super class
  createGraphQLServerOptions(context: unknown): Promise<GraphQLOptions> {
    return super.graphQLServerOptions({ context });
  }
}

export default autoService(initGraphQL);

/**
 * Initialize the GraphQL service
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.NODE_ENV
 * The injected NODE_ENV value
 * @param  {Array}   [services.GRAPHQL_OPTIONS]
 * The GraphQL options to pass to the schema
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
  GRAPHQL_OPTIONS = {},
  ENV,
  graphQLFragments = [],
  log = noop,
}: WhookGraphQLDependencies): Promise<WhookGraphQLService> {
  const apolloServer = new ApolloServer({
    parseOptions: GRAPHQL_OPTIONS.parseOptions,
    typeDefs: graphQLFragments.reduce(
      (accTypeDefs, { typeDefs }) => [...accTypeDefs, ...[].concat(typeDefs)],
      [],
    ),
    resolvers: graphQLFragments
      .map(({ resolvers }) => resolvers)
      .reduce(
        (accResolvers, resolvers) => [...accResolvers, ...[].concat(resolvers)],
        [],
      ),
    schemaDirectives: graphQLFragments.reduce(
      (accSchemaDirectives, { schemaDirectives }) => ({
        ...accSchemaDirectives,
        ...schemaDirectives,
      }),
      {},
    ),
    introspection: !!ENV.DEV_MODE,
  });

  await apolloServer.waitStart();

  const query: WhookGraphQLService['query'] = async ({
    context,
    query,
    operation,
  }) => {
    const options = await apolloServer.createGraphQLServerOptions(context);

    return runHttpQuery([], {
      options: {
        ...options,
        context,
      },
      method: operation.method.toUpperCase(),
      query,
      request: {
        url: operation.path,
        method: operation.method.toUpperCase(),
        headers: new Headers({}),
      },
    });
  };

  log('debug', '🕸️ - Initializing the GraphQL Service');

  return {
    query,
  };
}
