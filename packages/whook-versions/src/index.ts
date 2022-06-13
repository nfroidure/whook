import { YHTTPError } from 'yhttperror';
import semverSatisfies from 'semver/functions/satisfies.js';
import camelCase from 'camelcase';
import { DEFAULT_ERROR_URI, DEFAULT_HELP_URI } from '@whook/whook';
import {
  wrapInitializer,
  alsoInject,
  ServiceInitializerWrapper,
} from 'knifecycle';
import type { ServiceInitializer, Parameters } from 'knifecycle';
import type {
  WhookResponse,
  WhookHandler,
  WhookOperation,
  WhookErrorsDescriptors,
} from '@whook/whook';
import type { OpenAPIV3 } from 'openapi-types';

export const VERSIONS_ERRORS_DESCRIPTORS: WhookErrorsDescriptors = {
  E_DEPRECATED_VERSION: {
    code: 'bad_request',
    description:
      'The version header "$0" value ("$1") does not match the rule "$3"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};

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
export function wrapHandlerWithVersionChecker<D, S>(
  initHandler: ServiceInitializer<D, S>,
): ServiceInitializer<VersionsConfig & D, S> {
  const augmentedInitializer = alsoInject<VersionsConfig, D, S>(
    ['VERSIONS'],
    initHandler,
  );
  const initializerWrapper: ServiceInitializerWrapper<
    S,
    VersionsConfig & D
  > = async (services: VersionsConfig, handler: S) => {
    return handleWithVersionChecker.bind(
      null,
      services as VersionsConfig,
      handler as unknown as WhookHandler,
    ) as unknown as S;
  };

  return wrapInitializer(initializerWrapper, augmentedInitializer);
}

async function handleWithVersionChecker<
  R extends WhookResponse,
  O extends WhookOperation,
  P extends Parameters,
>(
  { VERSIONS }: VersionsConfig,
  handler: WhookHandler<P, R, O>,
  parameters: P,
  operation: O,
): Promise<R> {
  VERSIONS.forEach((version) => {
    const value = parameters[camelCase(version.header)];

    if (
      'undefined' !== typeof value &&
      !semverSatisfies(value, version.rule, { includePrerelease: true })
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
): Promise<OpenAPIV3.Document> {
  return {
    ...API,
    components: {
      ...(API.components || {}),
      parameters: {
        ...((API.components || {}).parameters || {}),
        ...VERSIONS.reduce<{ [key: string]: OpenAPIV3.ParameterObject }>(
          (versionsParameters, version) => ({
            ...versionsParameters,
            [camelCase(version.header)]: {
              name: version.header,
              in: 'header',
              required: false,
              example: '1.1.2-beta.1',
              schema: {
                type: 'string',
                pattern:
                  '^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)(?:-((?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\\.(?:0|[1-9]\\d*|\\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\\+([0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$',
              },
            },
          }),
          {},
        ),
      },
    },
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
      [path]: Object.keys(
        API.paths[path] || {},
      ).reduce<OpenAPIV3.PathItemObject>(reduceMethods, API.paths[path] || {}),
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
          VERSIONS.map((version) => ({
            $ref: `#/components/parameters/${camelCase(version.header)}`,
          })),
        ),
      },
    };
  }
}
