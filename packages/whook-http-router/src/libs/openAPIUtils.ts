import SwaggerParser from '@apidevtools/swagger-parser';
import type { $Refs } from '@apidevtools/swagger-parser';
import YError from 'yerror';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  DereferencedRequestBodyObject,
  DereferencedResponseObject,
  WhookOperation,
} from '@whook/http-transaction';

export const OPEN_API_METHODS = [
  'options',
  'head',
  'get',
  'put',
  'post',
  'patch',
  'delete',
  'trace',
];

export type WhookRawOperation<T = Record<string, unknown>> =
  OpenAPIV3.OperationObject & {
    path: string;
    method: string;
    'x-whook'?: T;
  };
export type SupportedSecurityScheme =
  | OpenAPIV3.HttpSecurityScheme
  | OpenAPIV3.ApiKeySecurityScheme
  | OpenAPIV3.OAuth2SecurityScheme;

/**
 * Flatten the inputed OpenAPI file
 *  object
 * @param  {Object} API
 * An Object containing a parser OpenAPI JSON
 * @return {Object}
 * The flattened OpenAPI definition
 */
export async function flattenOpenAPI(
  API: OpenAPIV3.Document,
): Promise<OpenAPIV3.Document> {
  try {
    const parser = new SwaggerParser();

    // Currently the OpenAPI parser changes the API in place
    //  this is why we're deep cloning it here
    const result = (await parser.dereference(
      JSON.parse(JSON.stringify(API)),
    )) as OpenAPIV3.Document;

    return result;
  } catch (err) {
    throw YError.wrap(err, 'E_BAD_OPEN_API');
  }
}

/**
 * Return a OpenAPI operation in a more
 *  convenient way to iterate onto its
 *  operations
 * @param  {Object} API
 * The flattened OpenAPI defition
 * @return {Array}
 * An array of all the OpenAPI operations
 * @example
 * getOpenAPIOperations(API)
 *   .map((operation) => {
 *     const { path, method, operationId, parameters } = operation;
 *
 *     // Do something with that operation
 *   });
 */
export function getOpenAPIOperations<T = Record<string, unknown>>(
  API: OpenAPIV3.Document,
): WhookRawOperation<T>[] {
  return Object.keys(API.paths).reduce<WhookRawOperation<T>[]>(
    (operations, path) =>
      Object.keys(API.paths[path])
        .filter((key) => OPEN_API_METHODS.includes(key))
        .reduce<WhookRawOperation<T>[]>((operations, method) => {
          const operation = {
            path,
            method,
            ...API.paths[path][method],
            parameters: (API.paths[path][method].parameters || []).concat(
              API.paths[path].parameters || [],
            ),
          };

          return [...operations, operation];
        }, operations),
    [],
  );
}

/**
 * Dereference API operations and transform OpenAPISchemas
 *  into JSONSchemas
 * @param  {Object} API
 * An OpenAPI object
 * @param  {Object} operations
 * The OpenAPI operation objects
 * @return {Object}
 * The dereferenced OpenAPI operations
 */
export async function dereferenceOpenAPIOperations<T = Record<string, unknown>>(
  API: OpenAPIV3.Document,
  operations: WhookRawOperation<T>[],
): Promise<WhookOperation<T>[]> {
  let $refs: $Refs;

  try {
    $refs = await SwaggerParser.resolve(API);
  } catch (err) {
    throw YError.wrap(err, 'E_BAD_OPEN_API');
  }

  return operations.map((operation) => {
    const parameters = (operation.parameters || [])
      .map((parameter) =>
        (parameter as OpenAPIV3.ReferenceObject).$ref
          ? ($refs.get(
              (parameter as OpenAPIV3.ReferenceObject).$ref,
            ) as OpenAPIV3.ParameterObject)
          : (parameter as OpenAPIV3.ParameterObject),
      )
      .map((parameter) => {
        // Currently supporting only schema based
        //  parameters
        if (!parameter.schema) {
          throw new YError('E_PARAMETER_WITHOUT_SCHEMA', parameter.name);
        }
        return {
          ...parameter,
          schema: (parameter.schema as OpenAPIV3.ReferenceObject).$ref
            ? ($refs.get(
                (parameter.schema as OpenAPIV3.ReferenceObject).$ref,
              ) as OpenAPIV3.SchemaObject)
            : (parameter.schema as OpenAPIV3.SchemaObject),
        };
      })
      .map((parameter) =>
        parameter.schema.type === 'array'
          ? {
              ...parameter,
              schema: {
                ...parameter.schema,
                items: (parameter.schema.items as OpenAPIV3.ReferenceObject)
                  .$ref
                  ? ($refs.get(
                      (parameter.schema.items as OpenAPIV3.ReferenceObject)
                        .$ref,
                    ) as OpenAPIV3.SchemaObject)
                  : (parameter.schema.items as OpenAPIV3.SchemaObject),
              },
            }
          : parameter,
      );
    const baseRequestBody = operation.requestBody
      ? (operation.requestBody as OpenAPIV3.ReferenceObject).$ref
        ? ($refs.get(
            (operation.requestBody as OpenAPIV3.ReferenceObject).$ref,
          ) as OpenAPIV3.ParameterObject)
        : (operation.requestBody as OpenAPIV3.RequestBodyObject)
      : undefined;

    const requestBody: DereferencedRequestBodyObject = baseRequestBody
      ? {
          ...baseRequestBody,
          content: Object.keys(baseRequestBody.content).reduce(
            (requestBodyContent, mediaType) => {
              const mediaTypeSchema = baseRequestBody.content[mediaType].schema
                ? (
                    baseRequestBody.content[mediaType]
                      .schema as OpenAPIV3.ReferenceObject
                  ).$ref
                  ? ($refs.get(
                      (
                        baseRequestBody.content[mediaType]
                          .schema as OpenAPIV3.ReferenceObject
                      ).$ref,
                    ) as OpenAPIV3.SchemaObject)
                  : (baseRequestBody.content[mediaType]
                      .schema as OpenAPIV3.SchemaObject)
                : undefined;

              return {
                ...requestBodyContent,
                [mediaType]: {
                  ...baseRequestBody.content[mediaType],
                  schema: buildJSONSchemaFromAPISchema(API, mediaTypeSchema),
                },
              };
            },
            {},
          ),
        }
      : undefined;
    const responses: Record<string, DereferencedResponseObject> = Object.keys(
      operation.responses || {},
    ).reduce((allResponses, status) => {
      const responseObject = (
        operation.responses[status] as OpenAPIV3.ReferenceObject
      ).$ref
        ? ($refs.get(
            (operation.responses[status] as OpenAPIV3.ReferenceObject).$ref,
          ) as OpenAPIV3.ResponseObject)
        : (operation.responses[status] as OpenAPIV3.ResponseObject);
      const finalResponseObject: DereferencedResponseObject = {
        ...responseObject,
        content: responseObject.content
          ? Object.keys(responseObject.content).reduce(
              (responseObjectContent, mediaType) => {
                const mediaTypeSchema = responseObject.content[mediaType].schema
                  ? (
                      responseObject.content[mediaType]
                        .schema as OpenAPIV3.ReferenceObject
                    ).$ref
                    ? ($refs.get(
                        (
                          responseObject.content[mediaType]
                            .schema as OpenAPIV3.ReferenceObject
                        ).$ref,
                      ) as OpenAPIV3.SchemaObject)
                    : (responseObject.content[mediaType]
                        .schema as OpenAPIV3.SchemaObject)
                  : undefined;

                return {
                  ...responseObjectContent,
                  [mediaType]: {
                    ...responseObject.content[mediaType],
                    schema: buildJSONSchemaFromAPISchema(API, mediaTypeSchema),
                  },
                };
              },
              {},
            )
          : undefined,
      };

      return {
        ...allResponses,
        [status]: finalResponseObject,
      };
    }, {});

    return {
      ...operation,
      parameters,
      requestBody,
      responses,
    };
  });
}

export function pickupOperationSecuritySchemes(
  openAPI: OpenAPIV3.Document,
  operation: WhookOperation,
): { [name: string]: SupportedSecurityScheme } {
  const securitySchemes =
    (openAPI.components && openAPI.components.securitySchemes) || {};

  return (operation.security || openAPI.security || []).reduce(
    (operationSecuritySchemes, security) => {
      const schemeKey = Object.keys(security)[0];

      if (!schemeKey) {
        return operationSecuritySchemes;
      }

      if (!securitySchemes[schemeKey]) {
        throw new YError(
          'E_UNDECLARED_SECURITY_SCHEME',
          schemeKey,
          operation.operationId,
        );
      }

      return {
        ...operationSecuritySchemes,
        [schemeKey]: securitySchemes[schemeKey] as SupportedSecurityScheme,
      };
    },
    {},
  ) as { [name: string]: SupportedSecurityScheme };
}

function buildJSONSchemaFromAPISchema(
  API: OpenAPIV3.Document,
  baseSchema: OpenAPIV3.SchemaObject,
): OpenAPIV3.SchemaObject {
  return JSON.parse(
    JSON.stringify({
      ...baseSchema,
      definitions: (API.components || {}).schemas || {},
    }).replace(/#\/components\/schemas\//g, '#/definitions/'),
  );
}
