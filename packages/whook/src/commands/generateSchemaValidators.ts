import { type AppEnvVars } from 'application-services';
import { type LogService } from 'common-services';
import { autoService, location } from 'knifecycle';
import { stdout } from 'node:process';
import { type OpenAPI } from 'ya-open-api-types';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';
import {
  DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  type WhookSchemaValidatorsOptions,
  buildSchemaValidatorsMap,
} from '../services/schemaValidators.js';

export const definition = {
  name: 'generateSchemaValidators',
  description: 'Build the schema validators with AJV',
  example: `whook generateSchemaValidators`,
  arguments: [],
} as const satisfies WhookCommandDefinition;

async function initGenerateSchemaValidatorsCommand({
  DEBUG_NODE_ENVS,
  SCHEMA_VALIDATORS_OPTIONS = DEFAULT_SCHEMA_VALIDATORS_OPTIONS,
  API,
  ENV,
  log,
  outstream = stdout,
}: {
  DEBUG_NODE_ENVS: string[];
  SCHEMA_VALIDATORS_OPTIONS: WhookSchemaValidatorsOptions;
  API: OpenAPI;
  ENV: AppEnvVars;
  log: LogService;
  outstream: NodeJS.WritableStream;
}): Promise<WhookCommandHandler> {
  return async () => {
    outstream.write(
      await buildSchemaValidatorsMap({
        DEBUG_NODE_ENVS,
        SCHEMA_VALIDATORS_OPTIONS,
        API,
        ENV,
        log,
      }),
    );
  };
}

export default location(
  autoService(initGenerateSchemaValidatorsCommand),
  import.meta.url,
);
