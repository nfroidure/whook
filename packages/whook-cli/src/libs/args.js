import Ajv from 'ajv';
import YError from 'yerror';

// TODO: Add ajv human readable error builder
export function readArgs(schema, args) {
  const ajv = new Ajv({ coerceTypes: true });
  const validator = ajv.compile(schema);

  const {
    _: [, ...listedArgs],
    ...namedArgs
  } = args;
  const cleanedArgs = {
    ...namedArgs,
    ...(listedArgs.length ? { _: listedArgs } : {}),
  };

  validator(cleanedArgs);

  if ((validator.errors || []).length) {
    throw new YError('E_BAD_ARGS', validator.errors);
  }

  return cleanedArgs;
}
