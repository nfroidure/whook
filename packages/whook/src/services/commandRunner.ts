import { type LogService } from 'common-services';
import {
  autoService,
  location,
  type FatalErrorService,
  type Knifecycle,
} from 'knifecycle';
import { pickYErrorWithCode, printStackTrace, YError } from 'yerror';
import { promptArgs, type WhookRawCommandArgs } from '../libs/args.js';
import { type WhookSchemaValidatorsService } from './schemaValidators.js';
import {
  DEFAULT_COERCION_OPTIONS,
  type WhookCoercionOptions,
} from '../libs/coercion.js';
import {
  type WhookCommandHandler,
  type WhookArgsTypes,
} from '../types/commands.js';
import { type WhookOpenAPI } from '../types/openapi.js';
import { getCasterForSchema } from '../libs/validation.js';
import { ensureResolvedObject } from 'ya-open-api-types';
import {
  type JSONSchema,
  type ExpressiveJSONSchema,
} from 'ya-json-schema-types';
import { type WhookMainDefinition } from './MAIN_HANDLER.js';

export interface WhookCommandRunnerEnv {
  CI?: string;
  NO_PROMPT?: string;
}
export interface WhookCommandRunnerDependencies {
  ENV: WhookCommandRunnerEnv;
  API: WhookOpenAPI;
  MAIN_DEFINITION: WhookMainDefinition;
  COERCION_OPTIONS?: WhookCoercionOptions;
  MAIN_HANDLER: WhookCommandHandler;
  schemaValidators: WhookSchemaValidatorsService;
  $ready: Promise<void>;
  $instance: Knifecycle;
  $fatalError: FatalErrorService;
  args: WhookRawCommandArgs;
  log: LogService;
}

async function initCommandRunner({
  ENV,
  API,
  MAIN_DEFINITION,
  COERCION_OPTIONS = DEFAULT_COERCION_OPTIONS,
  MAIN_HANDLER,
  schemaValidators,
  $ready,
  $instance,
  $fatalError,
  args,
  log,
}: WhookCommandRunnerDependencies): Promise<void> {
  async function commandRunner() {
    await $ready;

    if (MAIN_DEFINITION.type !== 'command') {
      throw new YError('E_BAD_COMMAND_DEFINITION', [MAIN_DEFINITION]);
    }

    try {
      if (MAIN_DEFINITION.config?.promptArgs && !ENV.CI && !ENV.NO_PROMPT) {
        // Required to ensure any logs are printed
        await Promise.resolve();

        args = await promptArgs(
          { API, COMMAND_DEFINITION: MAIN_DEFINITION },
          args,
        );
      }

      const castedArgs = {
        ...args,
        namedArguments: {} as Record<string, WhookArgsTypes>,
      };

      for (const argument of MAIN_DEFINITION.arguments) {
        const resolvedSchema = (await ensureResolvedObject(
          API,
          argument.schema,
        )) as ExpressiveJSONSchema;

        if (typeof args.namedArguments[argument.name] === 'undefined') {
          if (argument.required) {
            log('error', `❌ - Argument "${argument.name}" is required.`);
            throw new YError('E_MISSING_REQUIRED_ARG', [argument.name]);
          }
          if (
            'default' in resolvedSchema &&
            typeof resolvedSchema.default !== 'undefined'
          ) {
            castedArgs.namedArguments[argument.name] =
              resolvedSchema.default as WhookArgsTypes;
          }
          continue;
        }

        const caster = await getCasterForSchema(
          { API, COERCION_OPTIONS },
          resolvedSchema,
        );

        const validator = schemaValidators(argument.schema as JSONSchema);

        // TODO: Add ajv human readable error builder
        const castedValue = caster(args.namedArguments[argument.name]);

        validator(castedValue);

        if (validator.errors?.length) {
          throw new YError('E_BAD_ARG', [validator.errors]);
        }

        if (typeof castedValue !== 'undefined') {
          castedArgs.namedArguments[argument.name] = castedValue;
        }
      }

      const commandName = MAIN_DEFINITION.name.endsWith('Command')
        ? MAIN_DEFINITION.name
        : `${MAIN_DEFINITION.name}Command`;

      if (!MAIN_HANDLER) {
        throw new YError('E_NO_COMMAND_HANDLER', [commandName]);
      }

      await MAIN_HANDLER(castedArgs);

      await $instance.destroy();
    } catch (err) {
      const argError = pickYErrorWithCode(err as Error, 'E_BAD_ARG');

      if (argError) {
        log('debug-stack', printStackTrace(err));
        if (argError.debug[0][0].keyword === 'required') {
          if (argError.debug[0][0].params.missingProperty) {
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        if (argError.debug[0][0].keyword === 'additionalProperties') {
          if (argError.debug[0][0].params.additionalProperty === '_') {
            log('error', '💥 - No anonymous arguments allowed.');
            $fatalError.throwFatalError(err as Error);
            return;
          }
          if (argError.debug[0][0].params.additionalProperty) {
            log(
              'error',
              `💥 - Argument "${
                argError.debug[0][0].params.additionalProperty
              }" not allowed.`,
            );
            $fatalError.throwFatalError(err as Error);
            return;
          }
        }
        log(
          'error',
          `💥 - Error parsing arguments: ${
            argError.debug[0][0].keyword
          }, ${argError.debug[0][0].params}`,
        );
        $fatalError.throwFatalError(err as Error);
        return;
      }

      log('error-stack', printStackTrace(err));
      $fatalError.throwFatalError(err as Error);
      return;
    }
  }
  commandRunner();
}

export default location(autoService(initCommandRunner), import.meta.url);
