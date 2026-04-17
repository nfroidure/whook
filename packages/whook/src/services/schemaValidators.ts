import standaloneCode from 'ajv/dist/standalone/index.js';
import { autoService, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addAJVFormats from 'ajv-formats';
import { type LogService } from 'common-services';
import { type AppEnvVars } from 'application-services';
import {
  type OpenAPIReference,
  type OpenAPI,
  collectAPISchemas,
} from 'ya-open-api-types';
import {
  type ExpressiveJSONSchema,
  type JSONSchema,
} from 'ya-json-schema-types';
import { createHash } from '../libs/hash.js';
import { extractAPISecurityParametersSchemas } from '../libs/validation.js';
import { type WhookOpenAPI } from '../types/openapi.js';

/* Architecture Note #2.11.2.1: Schema validators

Maintain a single place for JSON schema validation
 since it may repeat for several routes. Also
 warrantying that the same schema leads to the
 same reference for the Siso router parameters
 unity checks.
*/

export const DEFAULT_SCHEMA_VALIDATORS_OPTIONS = {
  lazy: false,
  dedupe: false,
  hashLength: 16,
  buildSchemas: false,
} as const satisfies WhookSchemaValidatorsOptions;

/** Options for schema validation */
export interface WhookSchemaValidatorsOptions {
  /** Compile only at first validation */
  lazy: boolean;
  /**
   * Dedupe schemas based on their JSON representation
   * to reduce the amount of compiled validations functions
   */
  dedupe: boolean;
  /**
   * Size of the shake256 hash for deduping
   */
  hashLength: number;
  /**
   * Wether schemas will be built or not
   */
  buildSchemas: boolean;
}

export interface WhookSchemaValidatorsConfig {
  DEBUG_NODE_ENVS: string[];
  SCHEMA_VALIDATORS_OPTIONS?: WhookSchemaValidatorsOptions;
}
export type WhookSchemaValidatorsDependencies = WhookSchemaValidatorsConfig & {
  API: OpenAPI;
  ENV: AppEnvVars;
  log?: LogService;
};
export type WhookSchemaValidatorsService = (
  schema:
    | JSONSchema
    | ExpressiveJSONSchema
    | OpenAPIReference<ExpressiveJSONSchema>,
) => ValidateFunction;

/**
 * Initialize the schema validator service for
 *  application schemas validation. This central
 *  place is aimed to compile schemas once and
 *  use them many times.
 * @param  {Object}   services
 * The services it depends on
 * @param  {Object}   [services.SCHEMA_VALIDATORS_OPTIONS={}]
 * Options for the schema validators registry
 * @param  {Object}   [services.ENV={}]
 * An optional environment object
 * @param  {Object}   [services.log=noop]
 * An optional logging service
 * @param  {Object}   services.API
 * A valid Open API file
 * @return {Promise<Number>}
 * A promise of a schema validators registry
 */
async function initSchemaValidators({
  DEBUG_NODE_ENVS,
  SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  API,
  ENV,
  log = noop,
}: WhookSchemaValidatorsDependencies): Promise<WhookSchemaValidatorsService> {
  log('warning', `🖃 - Initializing the validators service.`);

  const validatorsMap: Record<string, ValidateFunction> = {};
  const ajv = new Ajv2020({
    verbose: DEBUG_NODE_ENVS.includes(ENV.NODE_ENV),
    strict: true,
    logger: {
      log: (...args: string[]) => log('debug', ...args),
      warn: (...args: string[]) => log('warning', ...args),
      error: (...args: string[]) => log('error', ...args),
    },
  });

  addAJVFormats.default(ajv);

  const schemas = collectAPISchemas(API);

  for (const schema of schemas) {
    if (
      'components' in schema.location &&
      schema.location.components === 'schemas'
    ) {
      const $ref = '#/components/schemas/' + schema.location.schemaName;

      ajv.addSchema(schema.schema, $ref);
    }
  }
  if (!SCHEMA_VALIDATORS_OPTIONS.lazy) {
    for (const schema of schemas) {
      if (
        'components' in schema.location &&
        schema.location.components === 'schemas'
      ) {
        const $ref = '#/components/schemas/' + schema.location.schemaName;

        validatorsMap[$ref] = ajv.getSchema($ref) as ValidateFunction;
      }
    }
  }

  return (
    schema:
      | JSONSchema
      | ExpressiveJSONSchema
      | OpenAPIReference<ExpressiveJSONSchema>,
  ) => {
    if (
      typeof schema === 'object' &&
      '$ref' in schema &&
      typeof schema.$ref === 'string'
    ) {
      if (!validatorsMap[schema.$ref]) {
        validatorsMap[schema.$ref] = ajv.getSchema(
          schema.$ref,
        ) as ValidateFunction;
      }
      return validatorsMap[schema.$ref];
    }

    if (!SCHEMA_VALIDATORS_OPTIONS.lazy) {
      log(
        'debug',
        `⚠️ - Prefer using $ref to OpenAPI schemas components to build more efficiently!`,
      );
      log('debug', JSON.stringify(schema));
    }

    if (SCHEMA_VALIDATORS_OPTIONS.dedupe) {
      const key = createHash(
        Buffer.from(JSON.stringify(schema)),
        SCHEMA_VALIDATORS_OPTIONS.hashLength,
      );

      if (!validatorsMap[key]) {
        validatorsMap[key] = ajv.compile(schema) as ValidateFunction;
      }
      return validatorsMap[key];
    }
    return ajv.compile(schema);
  };
}

export default location(autoService(initSchemaValidators), import.meta.url);

export async function buildSchemaValidatorsMap({
  DEBUG_NODE_ENVS,
  SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  API,
  ENV,
  log,
}: {
  DEBUG_NODE_ENVS: string[];
  SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
  API: OpenAPI;
  ENV: AppEnvVars;
  log: LogService;
}) {
  if (SCHEMA_VALIDATORS_OPTIONS.lazy) {
    log(
      'warning',
      `⚠️ - Using lazy compilation is not recommended when building schema validators.`,
    );
  }

  const ajv = new Ajv2020({
    verbose: DEBUG_NODE_ENVS.includes(ENV.NODE_ENV),
    strict: true,
    logger: {
      log: (...args: string[]) => log('debug', ...args),
      warn: (...args: string[]) => log('warning', ...args),
      error: (...args: string[]) => log('error', ...args),
    },
    // Using common JS since bugs with ESM
    // See: https://github.com/ajv-validator/ajv/issues/2598
    code: { source: true, esm: false },
  });

  addAJVFormats.default(ajv);

  const schemas = collectAPISchemas(API);
  const schemaMapper: Record<string, string> = {};

  schemas.push(
    ...(
      await extractAPISecurityParametersSchemas({
        API: API as unknown as WhookOpenAPI,
      })
    ).map((schema) => ({
      schema,
      location: {
        components: 'headers',
        headerName: '',
      } as const,
    })),
  );

  for (const schema of schemas) {
    if (
      'components' in schema.location &&
      schema.location.components === 'schemas'
    ) {
      const $ref = '#/components/schemas/' + schema.location.schemaName;

      schemaMapper['__schema_' + schema.location.schemaName] = $ref;
      ajv.addSchema(schema.schema, $ref);
    }
  }

  for (const schema of schemas) {
    if (
      'components' in schema.location &&
      schema.location.components === 'schemas'
    ) {
      continue;
    }

    const key =
      '__hash_' +
      createHash(
        Buffer.from(JSON.stringify(schema.schema)),
        SCHEMA_VALIDATORS_OPTIONS.hashLength,
      );
    const $ref = '#/components/hash/' + key;

    if (ajv.getSchema($ref)) {
      continue;
    }

    schemaMapper[key] = $ref;
    ajv.addSchema(schema.schema, $ref);
  }

  return (
    standaloneCode as unknown as (
      ajv: Ajv2020,
      schemaMapper: Record<string, string>,
    ) => string
  )(ajv, schemaMapper);
}
