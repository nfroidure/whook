import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import { YError } from 'yerror';
import baseParseArgs from 'yargs-parser';

export type WhookArgsTypes = string | boolean | number;
export type WhookCommandArgs<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
> = {
  namedArguments: T;
  rest: string[];
  command: string;
};
// Subset of JSON Schema types so not using @types/json-schema
export type WhookCommandDefinitionArguments = {
  type: 'object';
  required?: string[];
  additionalProperties: false;
  properties: Record<
    string,
    | {
        type: 'boolean' | 'string' | 'number';
        description: string;
        pattern?: string;
        format?: string;
        enum?: WhookArgsTypes[];
        default?: WhookArgsTypes;
      }
    | {
        type: 'array';
        description: string;
        minItems?: number;
        maxItems?: number;
        items: {
          type: 'boolean' | 'string' | 'number';
          description?: string;
          pattern?: string;
          format?: string;
          enum?: WhookArgsTypes[];
          default?: WhookArgsTypes;
        };
        default?: WhookArgsTypes[];
      }
  >;
};

export function parseArgs(rawArgs: string[]): WhookCommandArgs {
  const { _, ...args } = baseParseArgs(rawArgs.slice(2));
  const finalArgs = {
    namedArguments: args,
    rest: _.map((arg) => arg.toString()),
    command: rawArgs[1],
  };

  return finalArgs;
}

// TODO: Add ajv human readable error builder
export function readArgs<T extends WhookCommandArgs['namedArguments']>(
  schema: WhookCommandDefinitionArguments,
  args: WhookCommandArgs,
): WhookCommandArgs<T> {
  const ajv = new Ajv.default({
    coerceTypes: true,
    useDefaults: true,
    strict: true,
  });
  addAJVFormats.default(ajv);
  const validator = ajv.compile(schema);

  const { namedArguments, rest } = args;
  const cleanedArgs = {
    namedArguments,
    rest: rest.slice(1),
    command: rest[0],
  };

  validator(namedArguments);

  if ((validator.errors || []).length) {
    throw new YError('E_BAD_ARGS', validator.errors);
  }

  return cleanedArgs as WhookCommandArgs<T>;
}
