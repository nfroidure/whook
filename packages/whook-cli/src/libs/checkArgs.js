import Ajv from 'ajv';
import YError from 'yerror';

// TODO: Add ajv human readable error builder
export function checkArgs(schema, args) {
  const ajv = new Ajv({ coerceTypes: true });
  const validator = ajv.compile(schema);

  validator(args);

  if ((validator.errors || []).length) {
    throw new YError('E_BAD_ARGS', validator.errors);
  }
}
