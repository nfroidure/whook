import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import { YError } from 'yerror';
import type { WhookCommandDefinitionArguments } from '../services/promptArgs.js';
import type { WhookCommandArgs } from '../services/args.js';

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
