import type { OpenAPIV3 } from 'openapi-types';
import type {
  WhookAPISchemaDefinition,
  WhookAPIParameterDefinition,
  WhookAPIExampleDefinition,
  WhookAPIHeaderDefinition,
  WhookAPIResponseDefinition,
  WhookAPIRequestBodyDefinition,
} from '../services/API_DEFINITIONS.js';
import type { JsonObject, JsonValue } from 'type-fest';

type ComponentType = keyof NonNullable<OpenAPIV3.Document['components']>;

export const COMPONENTS_TYPES: ComponentType[] = [
  'schemas',
  'responses',
  'parameters',
  'examples',
  'requestBodies',
  'headers',
];

export function cleanupOpenAPI(api: OpenAPIV3.Document): OpenAPIV3.Document {
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
  return parts.reduce((curSchema, part) => {
    return curSchema[part];
  }, root as unknown as T) as T;
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
    | WhookAPIExampleDefinition<T>
    | WhookAPIHeaderDefinition
    | WhookAPIResponseDefinition
    | WhookAPIRequestBodyDefinition,
): OpenAPIV3.ReferenceObject {
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
