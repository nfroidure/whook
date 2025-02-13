import {
  type OpenAPIReference,
  type OpenAPIReferenceable,
  type OpenAPIExtension,
  OpenAPIParameter,
  OpenAPIExample,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPIHeader,
} from 'ya-open-api-types';
import { type JsonValue } from 'type-fest';
import {
  type WhookAPIExampleDefinition,
  type WhookAPIHeaderDefinition,
  type WhookAPIParameterDefinition,
  type WhookAPIRequestBodyDefinition,
  type WhookAPIResponseDefinition,
  type WhookAPISchemaDefinition,
} from '../types/openapi.js';
import { ExpressiveJSONSchema } from 'ya-json-schema-types';

export function refersTo<
  T extends
    | WhookAPISchemaDefinition<unknown>
    | WhookAPIParameterDefinition<unknown>
    | WhookAPIExampleDefinition<JsonValue>
    | WhookAPIHeaderDefinition
    | WhookAPIResponseDefinition
    | WhookAPIRequestBodyDefinition,
>(
  resource: T,
): OpenAPIReference<
  T extends WhookAPISchemaDefinition
    ? ExpressiveJSONSchema
    : T extends WhookAPIParameterDefinition<unknown>
      ? OpenAPIParameter<ExpressiveJSONSchema, OpenAPIExtension>
      : T extends WhookAPIExampleDefinition<infer U>
        ? OpenAPIExample<OpenAPIExample<U>>
        : T extends WhookAPIHeaderDefinition
          ? OpenAPIHeader<ExpressiveJSONSchema, OpenAPIExtension>
          : T extends WhookAPIResponseDefinition
            ? OpenAPIResponse<ExpressiveJSONSchema, OpenAPIExtension>
            : T extends WhookAPIRequestBodyDefinition
              ? OpenAPIRequestBody<ExpressiveJSONSchema, OpenAPIExtension>
              : OpenAPIReferenceable<unknown, OpenAPIExtension>
> {
  return {
    $ref: `#/components/${
      'schema' in resource
        ? 'schemas'
        : 'parameter' in resource
          ? 'parameters'
          : 'header' in resource
            ? 'headers'
            : 'response' in resource
              ? 'responses'
              : 'requestBody' in resource
                ? 'requestBodies'
                : 'examples'
    }/${resource.name}`,
  };
}
