import { type ValidateFunction } from 'ajv';
import { type AppEnvVars } from 'application-services';
import { type LogService, noop } from 'common-services';
import { autoService, location } from 'knifecycle';
import {
  type ExpressiveJSONSchema,
  type JSONSchema,
} from 'ya-json-schema-types';
import { type OpenAPI, type OpenAPIReference } from 'ya-open-api-types';
import { YError } from 'yerror';
import {
  DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  type WhookSchemaValidatorsOptions,
} from './schemaValidators.js';
import { createHash } from '../libs/hash.js';

/* Architecture Note #2.11.2.2: Built schema validators

Built version of the schema validator service.
*/

export interface WhookSchemaValidatorsConfig {
  DEBUG_NODE_ENVS: string[];
  SCHEMA_VALIDATORS_OPTIONS?: WhookSchemaValidatorsOptions;
}
export type WhookSchemaValidatorsDependencies = WhookSchemaValidatorsConfig & {
  VALIDATORS_MAP?: Record<string, ValidateFunction>;
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
 * The service dependencies
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
  SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  VALIDATORS_MAP,
  log = noop,
}: WhookSchemaValidatorsDependencies): Promise<WhookSchemaValidatorsService> {
  log('warning', `🖃 - Initializing the built validators service.`);

  if (typeof VALIDATORS_MAP === 'undefined') {
    log(
      'error',
      `🚫 - No schema validators map. Either use the dynamic service or set the schemas build option to true.`,
    );
    throw new YError('E_SCHEMAS_NOT_BUILT');
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
      const key = '__schema_' + schema.$ref.split('/').pop();

      if (!VALIDATORS_MAP[key]) {
        throw new YError('E_SCHEMA_NOT_BUILT', [key, schema]);
      }
      return VALIDATORS_MAP[key];
    }

    const key =
      '__hash_' +
      createHash(
        Buffer.from(JSON.stringify(schema)),
        SCHEMA_VALIDATORS_OPTIONS.hashLength,
      );

    if (VALIDATORS_MAP[key]) {
      return VALIDATORS_MAP[key];
    }

    log(`error`, `💥 - Failed to get computed schema!`);
    log(`error`, JSON.stringify(schema));
    throw new YError('E_SCHEMA_NOT_BUILT', [key, schema]);
  };
}

export default location(autoService(initSchemaValidators), import.meta.url);
