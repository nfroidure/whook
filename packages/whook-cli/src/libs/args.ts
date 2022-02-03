import Ajv from 'ajv';
import addAJVFormats from 'ajv-formats';
import YError from 'yerror';
import type { WhookCommandDefinitionArguments } from '../services/promptArgs';
import type { WhookCommandArgs } from '../services/args';

// TODO: Add ajv human readable error builder
export function readArgs<T extends Partial<WhookCommandArgs>>(
  schema: WhookCommandDefinitionArguments,
  args: WhookCommandArgs,
): T {
  const ajv = new Ajv({
    coerceTypes: true,
    useDefaults: true,
    strict: true,
  });
  addAJVFormats(ajv);
  const validator = ajv.compile(schema);

  const {
    _: [, ...listedArgs],
    ...namedArgs
  } = args;
  const cleanedArgs = {
    ...namedArgs,
    ...(listedArgs.length ? { _: listedArgs } : {}),
  } as WhookCommandArgs;

  validator(cleanedArgs);

  if ((validator.errors || []).length) {
    throw new YError('E_BAD_ARGS', validator.errors);
  }

  return cleanedArgs as T;
}
