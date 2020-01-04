import { WhookResponse, WhookHandler, WhookOperation } from '@whook/whook';
import {
  reuseSpecialProps,
  alsoInject,
  handler,
  ServiceInitializer,
  Parameters,
  Dependencies,
} from 'knifecycle';
import { OpenAPIV3 } from 'openapi-types';
import YHTTPError from 'yhttperror';
import semver from 'semver';
import camelCase from 'camel-case';

export type VersionDescriptor = {
  header: string;
  rule: string;
};
export type VersionsConfig = {
  VERSIONS: VersionDescriptor[];
};

/**
 * Wrap an handler initializer to check versions headers.
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export function wrapHandlerWithVersionChecker<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<D & VersionsConfig, S> {
  return alsoInject(
    ['VERSIONS'],
    reuseSpecialProps(
      initHandler,
      initHandlerWithVersionChecker.bind(null, initHandler),
    ),
  );
}

export async function initHandlerWithVersionChecker<D, S extends WhookHandler>(
  initHandler: ServiceInitializer<D, S>,
  services: D,
): Promise<S> {
  const handler = await initHandler(services);

  return handleWithVersionChecker.bind(null, services, handler);
}

async function handleWithVersionChecker<
  R extends WhookResponse,
  O extends WhookOperation,
  P extends Parameters
>(
  { VERSIONS }: VersionsConfig,
  handler: WhookHandler<R, O, P>,
  parameters: P,
  operation: O,
): Promise<R> {
  VERSIONS.forEach(version => {
    const value = parameters[camelCase(version.header)];

    if (
      'undefined' !== typeof value &&
      !semver.satisfies(value, version.rule, { includePrerelease: true })
    ) {
      throw new YHTTPError(
        418,
        'E_DEPRECATED_VERSION',
        version.header,
        value,
        version.rule,
      );
    }
  });

  return await handler(parameters, operation);
}

// TODO: This is here to do things fast but a proper way to
// do this would be to change the handlers signature so that
// one can access additional headers without having to declare them
// each time in the open API
// https://github.com/nfroidure/swagger-http-router/blob/e34c7f890627df4a062eee7932a658c25943ace3/src/router.js#L259
/**
 * Augment an OpenAPI with versions headers added.
 * @param {Object} API The OpenAPI object
 * @param {Object} VERSIONS The versions configurations
 * @returns {Promise<Object>} The augmented  OpenAPI object
 */
export async function augmentAPIWithVersionsHeaders(
  API: OpenAPIV3.Document,
  VERSIONS: VersionDescriptor[],
) {
  return {
    ...API,
    paths: Object.keys(API.paths).reduce<OpenAPIV3.PathsObject>(
      reducePaths,
      API.paths,
    ),
  };

  function reducePaths(
    pathsObject: OpenAPIV3.PathsObject,
    path: string,
  ): OpenAPIV3.PathsObject {
    return {
      ...pathsObject,
      [path]: Object.keys(API.paths[path]).reduce<OpenAPIV3.PathItemObject>(
        reduceMethods,
        API.paths[path],
      ),
    };
  }

  function reduceMethods(
    pathItemObject: OpenAPIV3.PathItemObject,
    method: string,
  ): OpenAPIV3.PathItemObject {
    return {
      ...pathItemObject,
      [method]: {
        ...pathItemObject[method],
        parameters: (pathItemObject[method].parameters || []).concat(
          VERSIONS.map(version => ({
            name: version.header,
            in: 'header',
            required: false,
            example: '1.1.2-beta.1',
            schema: {
              type: 'string',
              pattern:
                '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
            },
          })),
        ),
      },
    };
  }
}