import { type OpenAPIV3_1 } from 'openapi-types';
import {
  type WhookAPISchemaDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIExampleDefinition,
  type WhookAPIHeaderDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPIRequestBodyDefinition,
} from '../services/API_DEFINITIONS.js';
import { type JsonObject, type JsonValue } from 'type-fest';
import SwaggerParser, { type $Refs } from '@apidevtools/swagger-parser';
import { YError } from 'yerror';
import { type WhookOperation } from '../index.js';
import {
  type DereferencedRequestBodyObject,
  type DereferencedResponseObject,
} from '../services/httpTransaction.js';

type ComponentType = keyof NonNullable<OpenAPIV3_1.Document['components']>;

export const COMPONENTS_TYPES: ComponentType[] = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
];

export function cleanupOpenAPI(
  api: OpenAPIV3_1.Document,
): OpenAPIV3_1.Document {
  const seenRefs = [
    ...new Set(
      collectRefs(
        api as unknown as JsonObject,
        api.paths as unknown as JsonValue,
      ),
    ),
  ];

  return {
    ...api,
    components: {
      ...(Object.keys(api?.components || {}) as ComponentType[]).reduce(
        (cleanedComponents, componentType) => ({
          ...cleanedComponents,
          [componentType]: COMPONENTS_TYPES.includes(componentType)
            ? Object.keys(api?.components?.[componentType] || {})
                .filter((key) =>
                  seenRefs.includes(`#/components/${componentType}/${key}`),
                )
                .reduce(
                  (cleanedComponents, key) => ({
                    ...cleanedComponents,
                    [key]: api.components?.[componentType]?.[key],
                  }),
                  {},
                )
            : api.components?.[componentType],
        }),
        {},
      ),
    },
  };
}

export function splitRef(ref: string): string[] {
  return ref
    .replace(/^#\//, '')
    .split('/')
    .filter((s) => s);
}

export function resolve<T>(root: JsonObject, parts: string[]): T {
  return parts.reduce(
    (curSchema, part) => {
      return curSchema[part];
    },
    root as unknown as T,
  ) as T;
}

export function collectRefs(
  rootNode: JsonObject,
  node: JsonValue,
  seenRefs: string[] = [],
): string[] {
  if (node instanceof Array) {
    for (const item of node) {
      seenRefs = collectRefs(rootNode, item, seenRefs);
    }
  } else if (node !== null && typeof node === 'object') {
    const keys = Object.keys(node);

    if (typeof node.$ref === 'string' && !seenRefs.includes(node.$ref)) {
      const value = resolve<JsonValue>(rootNode, splitRef(node.$ref));

      seenRefs.push(node.$ref);
      seenRefs = [...new Set(collectRefs(rootNode, value, seenRefs))];
    }

    for (const key of keys) {
      if (key === '$ref') {
        continue;
      }
      seenRefs = collectRefs(rootNode, node[key] || null, seenRefs);
    }
  }

  return seenRefs;
}

export function refersTo<T>(
  resource:
    | WhookAPISchemaDefinition<T>
    | WhookAPIParameterDefinition<T>
    | WhookAPIExampleDefinition<
        T extends JsonValue | OpenAPIV3_1.ReferenceObject ? T : never
      >
    | WhookAPIHeaderDefinition
    | WhookAPIResponseDefinition
    | WhookAPIRequestBodyDefinition,
): OpenAPIV3_1.ReferenceObject {
  return {
    $ref: `#/components/${
      (resource as WhookAPISchemaDefinition<T>).schema
        ? 'schemas'
        : (resource as WhookAPIParameterDefinition<T>).parameter
          ? 'parameters'
          : (resource as WhookAPIHeaderDefinition).header
            ? 'headers'
            : (resource as WhookAPIResponseDefinition).response
              ? 'responses'
              : (resource as WhookAPIRequestBodyDefinition).requestBody
                ? 'requestBodies'
                : 'examples'
    }/${resource.name}`,
  };
}

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
  OpenAPIV3_1.OperationObject<{
    path: string;
    method: string;
    'x-whook'?: T;
  }>;
export type SupportedSecurityScheme =
  | OpenAPIV3_1.HttpSecurityScheme
  | OpenAPIV3_1.ApiKeySecurityScheme
  | OpenAPIV3_1.OAuth2SecurityScheme;

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
  API: OpenAPIV3_1.Document,
): WhookRawOperation<T>[] {
  return Object.keys(API?.paths || {}).reduce<WhookRawOperation<T>[]>(
    (operations, path) =>
      Object.keys(API.paths?.[path] || {})
        .filter((key) => OPEN_API_METHODS.includes(key))
        .reduce<WhookRawOperation<T>[]>((operations, method) => {
          const operation = {
            path,
            method,
            ...API.paths?.[path]?.[method],
            parameters: (API?.paths?.[path]?.[method].parameters || []).concat(
              API?.paths?.[path]?.parameters || [],
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
  API: OpenAPIV3_1.Document,
  operations: WhookRawOperation<T>[],
): Promise<WhookOperation<T>[]> {
  let $refs: $Refs;

  try {
    $refs = await SwaggerParser.resolve(API);
  } catch (err) {
    throw YError.wrap(err as Error, 'E_BAD_OPEN_API');
  }

  return operations.map((operation) => {
    const parameters = (operation.parameters || [])
      .map((parameter) =>
        (parameter as OpenAPIV3_1.ReferenceObject).$ref
          ? ($refs.get(
              (parameter as OpenAPIV3_1.ReferenceObject).$ref,
            ) as OpenAPIV3_1.ParameterObject)
          : (parameter as OpenAPIV3_1.ParameterObject),
      )
      .map((parameter) => {
        // Currently supporting only schema based
        //  parameters
        if (!parameter.schema) {
          throw new YError('E_PARAMETER_WITHOUT_SCHEMA', parameter.name);
        }
        return {
          ...parameter,
          schema: (parameter.schema as OpenAPIV3_1.ReferenceObject).$ref
            ? ($refs.get(
                (parameter.schema as OpenAPIV3_1.ReferenceObject).$ref,
              ) as OpenAPIV3_1.SchemaObject)
            : (parameter.schema as OpenAPIV3_1.SchemaObject),
        };
      })
      .map((parameter) =>
        parameter.schema.type === 'array'
          ? {
              ...parameter,
              schema: {
                ...parameter.schema,
                items: (parameter.schema.items as OpenAPIV3_1.ReferenceObject)
                  .$ref
                  ? ($refs.get(
                      (parameter.schema.items as OpenAPIV3_1.ReferenceObject)
                        .$ref,
                    ) as OpenAPIV3_1.SchemaObject)
                  : (parameter.schema.items as OpenAPIV3_1.SchemaObject),
              },
            }
          : parameter,
      );
    const baseRequestBody = operation.requestBody
      ? (operation.requestBody as OpenAPIV3_1.ReferenceObject).$ref
        ? ($refs.get(
            (operation.requestBody as OpenAPIV3_1.ReferenceObject).$ref,
          ) as OpenAPIV3_1.ParameterObject)
        : (operation.requestBody as OpenAPIV3_1.RequestBodyObject)
      : undefined;

    const requestBody: DereferencedRequestBodyObject | undefined =
      baseRequestBody
        ? {
            ...baseRequestBody,
            content: Object.keys(baseRequestBody.content || {}).reduce(
              (requestBodyContent, mediaType) => {
                const mediaTypeSchema = baseRequestBody.content?.[mediaType]
                  .schema
                  ? (
                      baseRequestBody.content[mediaType]
                        .schema as OpenAPIV3_1.ReferenceObject
                    ).$ref
                    ? ($refs.get(
                        (
                          baseRequestBody.content[mediaType]
                            .schema as OpenAPIV3_1.ReferenceObject
                        ).$ref,
                      ) as OpenAPIV3_1.SchemaObject)
                    : (baseRequestBody.content[mediaType]
                        .schema as OpenAPIV3_1.SchemaObject)
                  : undefined;

                return {
                  ...requestBodyContent,
                  [mediaType]: {
                    ...baseRequestBody.content?.[mediaType],
                    schema: buildJSONSchemaFromAPISchema(
                      API,
                      mediaTypeSchema as OpenAPIV3_1.SchemaObject,
                    ),
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
      const responseObject =
        operation.responses && '$ref' in operation.responses[status]
          ? ($refs.get(
              (operation.responses[status] as OpenAPIV3_1.ReferenceObject).$ref,
            ) as OpenAPIV3_1.ResponseObject)
          : (operation?.responses?.[status] as OpenAPIV3_1.ResponseObject);
      const finalResponseObject: DereferencedResponseObject = {
        ...responseObject,
        content: responseObject.content
          ? Object.keys(responseObject.content).reduce(
              (responseObjectContent, mediaType) => {
                const mediaTypeSchema = responseObject.content?.[mediaType]
                  .schema
                  ? (
                      responseObject.content[mediaType]
                        .schema as OpenAPIV3_1.ReferenceObject
                    ).$ref
                    ? ($refs.get(
                        (
                          responseObject.content[mediaType]
                            .schema as OpenAPIV3_1.ReferenceObject
                        ).$ref,
                      ) as OpenAPIV3_1.SchemaObject)
                    : (responseObject.content[mediaType]
                        .schema as OpenAPIV3_1.SchemaObject)
                  : undefined;

                return {
                  ...responseObjectContent,
                  [mediaType]: {
                    ...responseObject.content?.[mediaType],
                    schema: buildJSONSchemaFromAPISchema(
                      API,
                      mediaTypeSchema as OpenAPIV3_1.SchemaObject,
                    ),
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
    } as WhookOperation<T>;
  });
}

export function pickupOperationSecuritySchemes(
  openAPI: OpenAPIV3_1.Document,
  operation: WhookOperation,
): { [name: string]: SupportedSecurityScheme } {
  const securitySchemes =
    (openAPI.components && openAPI.components.securitySchemes) || {};

  return (operation.security || openAPI.security || []).reduce<{
    [name: string]: SupportedSecurityScheme;
  }>((operationSecuritySchemes, security) => {
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
  }, {});
}

function buildJSONSchemaFromAPISchema(
  API: OpenAPIV3_1.Document,
  baseSchema: OpenAPIV3_1.SchemaObject,
): OpenAPIV3_1.SchemaObject {
  return JSON.parse(
    JSON.stringify({
      ...baseSchema,
      definitions: (API.components || {}).schemas || {},
    }).replace(/#\/components\/schemas\//g, '#/definitions/'),
  );
}
