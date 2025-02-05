import camelCase from 'camelcase';
import initWrapHandlerWithVersionChecker from './wrappers/wrapHandlerWithVersionChecker.js';
import {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import {
  type OpenAPIParameter,
  type OpenAPI,
  type OpenAPIPathItem,
  type OpenAPIPaths,
  type OpenAPIExtension,
} from 'ya-open-api-types';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import { type VersionDescriptor } from './wrappers/wrapHandlerWithVersionChecker.js';

export const VERSIONS_ERRORS_DESCRIPTORS: WhookErrorsDescriptors = {
  E_DEPRECATED_VERSION: {
    code: 'bad_request',
    description:
      'The version header "$0" value ("$1") does not match the rule "$3"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};

export { initWrapHandlerWithVersionChecker };

export type {
  VersionDescriptor,
  VersionsConfig,
  VersionsCheckerDependencies,
} from './wrappers/wrapHandlerWithVersionChecker.js';

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
  API: OpenAPI,
  VERSIONS: VersionDescriptor[],
): Promise<OpenAPI> {
  return {
    ...API,
    components: {
      ...(API.components || {}),
      parameters: {
        ...((API.components || {}).parameters || {}),
        ...VERSIONS.reduce<{
          [key: string]: OpenAPIParameter<
            ExpressiveJSONSchema,
            OpenAPIExtension
          >;
        }>(
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
    paths: Object.keys(API.paths || {}).reduce<
      OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>
    >(reducePaths, API.paths || {}),
  };

  function reducePaths(
    pathsObject: OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension>,
    path: string,
  ): OpenAPIPaths<ExpressiveJSONSchema, OpenAPIExtension> {
    return {
      ...pathsObject,
      [path]: Object.keys(API.paths?.[path] || {}).reduce<
        OpenAPIPathItem<ExpressiveJSONSchema, OpenAPIExtension>
      >(reduceMethods, API.paths?.[path] || {}),
    };
  }

  function reduceMethods(
    pathItemObject: OpenAPIPathItem<ExpressiveJSONSchema, OpenAPIExtension>,
    method: string,
  ): OpenAPIPathItem<ExpressiveJSONSchema, OpenAPIExtension> {
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
