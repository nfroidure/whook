import { select, checkbox, input, password } from '@inquirer/prompts';
import {
  type WhookCommandSchema,
  type WhookCommandDefinition,
} from '../types/commands.js';
import baseParseArgs from 'yargs-parser';
import { type WhookOpenAPI } from '../types/openapi.js';
import { ensureResolvedObject } from 'ya-open-api-types';

export interface WhookRawCommandArgs {
  namedArguments: Record<string, string | string[]>;
  rest: string[];
  command: string;
  subargs?: string[];
}

export function parseArgs(rawArgs: string[]): WhookRawCommandArgs {
  const {
    _,
    '--': subargs,
    ...args
  } = baseParseArgs(rawArgs.slice(2), {
    configuration: {
      'parse-numbers': false,
      'parse-positional-numbers': false,
      'duplicate-arguments-array': true,
      'flatten-duplicate-arrays': true,
      'greedy-arrays': false,
      'dot-notation': false,
      'populate--': true,
    },
  });
  const finalArgs = {
    namedArguments: Object.keys(args).reduce(
      (cleanArgs, key) => ({
        ...cleanArgs,
        // Avoid having the --arg shortcut for --arg=true to
        // provide a boolean and the parser to detect numbers
        // since we coerce the args later
        [key]:
          args[key] instanceof Array
            ? args[key].map((value) =>
                typeof value === 'boolean' || typeof value === 'number'
                  ? value.toString()
                  : value,
              )
            : typeof args[key] === 'boolean' || typeof args[key] === 'number'
              ? args[key].toString()
              : args[key],
      }),
      {},
    ),
    rest: _.map((arg) => arg.toString()),
    command: rawArgs[1],
    subargs: subargs?.map((subarg) => subarg.toString()),
  };

  return finalArgs;
}

export async function promptArgs(
  {
    API,
    COMMAND_DEFINITION,
  }: {
    API: WhookOpenAPI;
    COMMAND_DEFINITION: WhookCommandDefinition;
  },
  args: WhookRawCommandArgs,
): Promise<WhookRawCommandArgs> {
  const newNamedArgs: WhookRawCommandArgs['namedArguments'] = {};

  for (const argument of COMMAND_DEFINITION.arguments) {
    if ('undefined' === typeof args.namedArguments[argument.name]) {
      let schema = argument.schema;

      if ('$ref' in schema) {
        schema = (await ensureResolvedObject(
          API,
          schema.$ref,
        )) as WhookCommandSchema;
      }

      if (!('type' in schema)) {
        newNamedArgs[argument.name] = await input({
          message: `Enter the value for "${argument.name}": `,
          default: schema.default?.toString(),
          required: argument.required,
        });
        continue;
      }

      if (schema.type === 'boolean') {
        newNamedArgs[argument.name] = (
          await checkbox<string>({
            message: `Enter the value for "${argument.name}": `,
            choices: ['true', 'false'],
            required: argument.required,
          })
        )
          .includes('true')
          .toString();
        continue;
      }

      if (schema.type === 'string' || schema.type === 'number') {
        if (schema.format === 'password') {
          newNamedArgs[argument.name] = await password({
            message: `Enter the value for "${argument.name}": `,
          });
          continue;
        }

        if (schema.enum) {
          newNamedArgs[argument.name] = await select<string>({
            message: `Enter the value for "${argument.name}": `,
            default: schema.default?.toString(),
            choices: schema.enum.map((value: unknown) => ({
              name: value as string,
              value: (value as string).toString(),
            })),
          });
          continue;
        }

        newNamedArgs[argument.name] = await input({
          message: `Enter the value for "${argument.name}": `,
          required: argument.required,
          default: schema.default?.toString(),
        });

        continue;
      }

      if ('default' in schema) {
        newNamedArgs[argument.name] = schema.default as string;
        continue;
      }
    }
  }

  return {
    ...args,
    namedArguments: {
      ...args.namedArguments,
      ...newNamedArgs,
    },
  };
}
