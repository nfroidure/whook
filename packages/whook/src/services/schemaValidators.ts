import { autoService, location } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { Ajv2020, type ValidateFunction } from 'ajv/dist/2020.js';
import addAJVFormats from 'ajv-formats';
import { type LogService } from 'common-services';
import { type AppEnvVars } from 'application-services';
import { type OpenAPI } from 'ya-open-api-types';
import { type JSONSchema } from 'ya-json-schema-types';

/* Architecture Note #2.11.2.1: Schema validators

Maintain a single place for JSON schema validation
 since it may repeat for several routes. Also
 warrantying that the same schema leads to the
 same reference for the Siso router parameters
 unity checks.
*/

export const DEFAULT_SCHEMA_VALIDATORS_OPTIONS = {
  lazy: false,
  optimistic: true,
} as const satisfies WhookSchemaValidatorsOptions;

/** Options for schema validation */
export type WhookSchemaValidatorsOptions = {
  /** Compile only at first validation */
  lazy: boolean;
  /** Consider that reused schemas are always using refs */
  optimistic: boolean;
};

export type WhookSchemaValidatorsConfig = {
  DEBUG_NODE_ENVS: string[];
  SCHEMA_VALIDATORS_OPTIONS?: WhookSchemaValidatorsOptions;
};
export type WhookSchemaValidatorsDependencies = WhookSchemaValidatorsConfig & {
  API: OpenAPI;
  ENV: AppEnvVars;
  log?: LogService;
};
export type WhookSchemaValidatorsService = (
  schema: JSONSchema,
) => ValidateFunction;

export default location(autoService(initSchemaValidators), import.meta.url);

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
  log('debug', `🖃 - Initializing the validators service.`);

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

  if (API?.components?.schemas) {
    for (const key of Object.keys(API.components.schemas)) {
      ajv.addSchema(API.components.schemas[key], '#/components/schemas/' + key);
    }
    if (!SCHEMA_VALIDATORS_OPTIONS.lazy) {
      for (const key of Object.keys(API.components.schemas)) {
        validatorsMap['#/components/schemas/' + key] = ajv.getSchema(
          '#/components/schemas/' + key,
        ) as ValidateFunction;
      }
    }
  }

  return (schema: JSONSchema) => {
    if (schema === true) {
      if (!validatorsMap['special://true']) {
        validatorsMap['special://true'] = ajv.compile(true);
      }
      return validatorsMap['special://true'];
    }
    if (schema === false) {
      if (!validatorsMap['special://false']) {
        validatorsMap['special://false'] = ajv.compile(false);
      }
      return validatorsMap['special://false'];
    }
    if ('$ref' in schema && typeof schema.$ref === 'string') {
      if (!validatorsMap[schema.$ref]) {
        validatorsMap[schema.$ref] = ajv.getSchema(
          schema.$ref,
        ) as ValidateFunction;
      }
      return validatorsMap[schema.$ref];
    }
    if (SCHEMA_VALIDATORS_OPTIONS.optimistic !== true) {
      const key =
        'data:text/plain;base64,' +
        Buffer.from(JSON.stringify(schema)).toString('base64');

      if (!validatorsMap[key]) {
        validatorsMap[key] = ajv.compile(schema) as ValidateFunction;
      }
      return validatorsMap[key];
    }
    return ajv.compile(schema);
  };
}
