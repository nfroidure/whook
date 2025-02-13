import { JsonValue } from 'type-fest';
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
  type OpenAPIExample,
} from 'ya-open-api-types';

export interface WhookOpenAPIOperation
  extends Pick<
    OpenAPIOperation<ExpressiveJSONSchema, OpenAPIExtension>,
    | 'tags'
    | 'summary'
    | 'description'
    | 'externalDocs'
    | 'parameters'
    | 'requestBody'
    | 'responses'
    | 'callbacks'
    | 'deprecated'
    | 'security'
    | 'servers'
  > {
  operationId: string;
}

export interface WhookOpenAPI
  extends OpenAPI<ExpressiveJSONSchema, OpenAPIExtension> {
  paths?: {
    [key: `/${string}`]: OpenAPIPathItem<
      ExpressiveJSONSchema,
      OpenAPIExtension
    > & {
      get?: WhookOpenAPIOperation;
      put?: WhookOpenAPIOperation;
      post?: WhookOpenAPIOperation;
      delete?: WhookOpenAPIOperation;
      options?: WhookOpenAPIOperation;
      head?: WhookOpenAPIOperation;
      patch?: WhookOpenAPIOperation;
      trace?: WhookOpenAPIOperation;
    };
  };
}

export type WhookSupportedParameter = Extract<
  OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>,
  { schema: ExpressiveJSONSchema }
>;

export interface WhookAPISchemaDefinition<
  T extends JsonValue | void | unknown = unknown,
> {
  name: string;
  schema: ExpressiveJSONSchema;
  example?: T;
  examples?: Record<string, OpenAPIExample>;
}

export interface WhookAPIParameterDefinition<
  T extends JsonValue | void | unknown = unknown,
> {
  name: string;
  parameter: OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>;
  example?: T;
  examples?: Record<string, OpenAPIExample>;
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
