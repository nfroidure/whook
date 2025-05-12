import { type LogService } from 'common-services';
import {
  autoService,
  location,
  type FatalErrorService,
  type Knifecycle,
} from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import { promptArgs, type WhookRawCommandArgs } from '../libs/args.js';
import { type WhookSchemaValidatorsService } from './schemaValidators.js';
import {
  DEFAULT_COERCION_OPTIONS,
  type WhookCoercionOptions,
} from '../libs/coercion.js';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';
import { type WhookOpenAPI } from '../types/openapi.js';
import { getCasterForSchema } from '../libs/validation.js';
import { ensureResolvedObject } from 'ya-open-api-types';
import { type ExpressiveJSONSchema } from 'ya-json-schema-types';

export type WhookCommandEnv = {
  CI?: string;
  NO_PROMPT?: string;
};

async function initCommand({
  ENV,
  API,
  COMMAND_DEFINITION,
  COERCION_OPTIONS = DEFAULT_COERCION_OPTIONS,
  commandHandler,
  schemaValidators,
  $ready,
  $instance,
  $fatalError,
  args,
  log,
}: {
  ENV: WhookCommandEnv;
  API: WhookOpenAPI;
  COMMAND_DEFINITION: WhookCommandDefinition;
  COERCION_OPTIONS?: WhookCoercionOptions;
  commandHandler: WhookCommandHandler;
  schemaValidators: WhookSchemaValidatorsService;
  $ready: Promise<void>;
  $instance: Knifecycle;
  $fatalError: FatalErrorService;
  args: WhookRawCommandArgs;
  log: LogService;
}): Promise<void> {
  async function commandRunner() {
    await $ready;

    try {
      if (COMMAND_DEFINITION.config?.promptArgs && !ENV.CI && !ENV.NO_PROMPT) {
        // Required to ensure any logs are printed
        await Promise.resolve();

        args = await promptArgs({ API, COMMAND_DEFINITION }, args);
      }

      for (const argument of COMMAND_DEFINITION.arguments) {
        const resolvedSchema = (await ensureResolvedObject(
          API,
          argument.schema,
        )) as ExpressiveJSONSchema;

        if (typeof args.namedArguments[argument.name] === 'undefined') {
          if (argument.required) {
            log('error', `❌ - Argument "${argument.name}" is required.`);
            throw new YError('E_MISSING_REQUIRED_ARG', argument.name);
          }
          if (resolvedSchema.default) {
            args.namedArguments[argument.name] =
              resolvedSchema.default as string;
          }
          continue;
        }

        const caster = await getCasterForSchema(
          { API, COERCION_OPTIONS },
          resolvedSchema,
        );

        const validator = schemaValidators(argument.schema);

        // TODO: Add ajv human readable error builder
        validator(caster(args.namedArguments[argument.name]));

        if ((validator.errors || []).length) {
          throw new YError('E_BAD_ARG', validator.errors);
        }
      }

      await commandHandler(args);

      await $instance.destroy();
    } catch (err) {
      if ((err as YError).code === 'E_BAD_ARG') {
        log('error-stack', printStackTrace(err as Error));
        if ((err as YError).params[0][0].keyword === 'required') {
          if ((err as YError).params[0][0].params.missingProperty) {
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        if ((err as YError).params[0][0].keyword === 'additionalProperties') {
          if ((err as YError).params[0][0].params.additionalProperty === '_') {
            log('error', 'No anonymous arguments allowed.');
            $fatalError.throwFatalError(err as Error);
            return;
          }
          if ((err as YError).params[0][0].params.additionalProperty) {
            log(
              'error',
              `Argument "${
                (err as YError).params[0][0].params.additionalProperty
              }" not allowed.`,
            );
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        log(
          'error',
          'Error parsing arguments: ',
          (err as YError).params[0][0].message,
          (err as YError).params[0][0].params,
        );
        $fatalError.throwFatalError(err as Error);
        return;
      }
      $fatalError.throwFatalError(err as Error);
      return;
    }
  }
  commandRunner();
}

export default location(autoService(initCommand), import.meta.url);
