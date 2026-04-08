import { type JsonValue } from 'type-fest';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';
import {
  type OpenAPI,
  type OpenAPIExtension,
  type OpenAPIOperation,
  type OpenAPIParameter,
  type OpenAPIPathItem,
  type OpenAPIHeader,
  type OpenAPIRequestBody,
  type OpenAPIResponse,
  type OpenAPIReference,
  type OpenAPICallback,
  isValidOpenAPIPath,
  PATH_ITEM_METHODS,
  OpenAPIMethod,
} from 'ya-open-api-types';
import { YError } from 'yerror';

export interface WhookOpenAPIOperation extends Omit<
  OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension>,
  'operationId'
> {
  operationId: string;
}

export interface WhookOpenAPI extends OpenAPI<
  ExpressiveJSONSchema,
  OpenAPIExtension
> {
  paths?: Record<
    `/${string}`,
    Omit<
      OpenAPIPathItem<ExpressiveJSONSchema, OpenAPIExtension>,
      OpenAPIMethod
    > &
      Partial<Record<OpenAPIMethod, WhookOpenAPIOperation>>
  >;
}

export type WhookSupportedParameter = Extract<
  OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>,
  { schema: ExpressiveJSONSchema | OpenAPIReference<ExpressiveJSONSchema> }
>;

export interface WhookAPISchemaDefinition<
  T extends JsonValue | undefined | unknown = unknown,
> {
  name: string;
  schema: ExpressiveJSONSchema;
  example?: T;
  examples?: Record<string, T>;
}

export interface WhookAPIParameterDefinition<
  T extends JsonValue | undefined | unknown = unknown,
> {
  name: string;
  parameter: OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>;
  example?: T;
  examples?: Record<string, T>;
}

export interface WhookAPIExampleDefinition<T extends JsonValue> {
  name: string;
  example: T;
}

export interface WhookAPIHeaderDefinition {
  name: string;
  header:
    | OpenAPIHeader<ExpressiveJSONSchema, OpenAPIExtension>
    | OpenAPIReference<OpenAPIHeader<ExpressiveJSONSchema, OpenAPIExtension>>;
}

export interface WhookAPIResponseDefinition {
  name: string;
  response:
    | OpenAPIResponse<ExpressiveJSONSchema, OpenAPIExtension>
    | OpenAPIReference<OpenAPIResponse<ExpressiveJSONSchema, OpenAPIExtension>>;
}

export interface WhookAPIRequestBodyDefinition {
  name: string;
  requestBody:
    | OpenAPIRequestBody<ExpressiveJSONSchema, OpenAPIExtension>
    | OpenAPIReference<
        OpenAPIRequestBody<ExpressiveJSONSchema, OpenAPIExtension>
      >;
}
export interface WhookAPICallbackDefinition {
  name: string;
  callback:
    | OpenAPICallback<ExpressiveJSONSchema, OpenAPIExtension>
    | OpenAPIReference<OpenAPICallback<ExpressiveJSONSchema, OpenAPIExtension>>;
}

export function isValidWhookOpenAPI(
  api: WhookOpenAPI | OpenAPI<ExpressiveJSONSchema, OpenAPIExtension>,
): api is WhookOpenAPI {
  for (const path in api.paths) {
    if (isValidOpenAPIPath(path)) {
      const pathItem = api.paths[path];

      if (typeof pathItem === 'undefined' || '$ref' in pathItem) {
        throw new YError('E_BAD_PATH_ITEM', [path, pathItem]);
      }

      for (const method of PATH_ITEM_METHODS) {
        if (pathItem[method]) {
          if ('$ref' in pathItem[method] || !pathItem[method].operationId) {
            throw new YError('E_BAD_OPERATION', [
              path,
              method,
              pathItem[method],
            ]);
          }
        }
      }
    }
  }

  return true;
}
