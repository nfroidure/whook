import { select, checkbox, input, password } from '@inquirer/prompts';
import {
  WhookCommandSchema,
  type WhookCommandDefinition,
} from '../types/commands.js';
import baseParseArgs from 'yargs-parser';
import { WhookOpenAPI } from '../types/openapi.js';
import { ensureResolvedObject } from 'ya-open-api-types';

export type WhookRawCommandArgs = {
  namedArguments: Record<string, string>;
  rest: string[];
  command: string;
};

export function parseArgs(rawArgs: string[]): WhookRawCommandArgs {
  const { _, ...args } = baseParseArgs(rawArgs.slice(2));
  const finalArgs = {
    namedArguments: Object.keys(args).reduce(
      (cleanArgs, key) => ({
        ...cleanArgs,
        // Avoid having the --arg shortcut for --arg=true to
        // provide a boolean since we coerce the args later 
        [key]: typeof args[key] === 'boolean' ? args[key].toString() : args[key],
      }),
      {},
    ),
    rest: _.map((arg) => arg.toString()),
    command: rawArgs[1],
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
  const newNamedArgs = {};

  for (const argument of COMMAND_DEFINITION.arguments) {
    if ('undefined' === typeof args.namedArguments[argument.name]) {
      let schema = argument.schema;

      if ('$ref' in schema) {
        schema = (await ensureResolvedObject(
          API,
          schema.$ref,
        )) as WhookCommandSchema;
        newNamedArgs[argument.name] = await input({
          message: `Enter the value for "${argument.name}": `,
          default: schema.default?.toString(),
          required: argument.required,
        });
        continue;
      }

      if (!('default' in schema)) {
        newNamedArgs[argument.name] = schema.default?.toString();
        continue;
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
        newNamedArgs[argument.name] = await checkbox({
          message: `Enter the value for "${argument.name}": `,
          choices: ['true', 'false'],
          required: argument.required,
        });
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
          newNamedArgs[argument.name] = await select({
            message: `Enter the value for "${argument.name}": `,
            default: schema.default?.toString(),
            choices: schema.enum.map((value) => ({
              name: value,
              value: value.toString(),
            })),
          });
          continue;
        }

        newNamedArgs[argument.name] = await input({
          message: `Enter the value for "${argument.name}": `,
          required: argument.required,
        });
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
