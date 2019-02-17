import { PassThrough } from 'stream';
import qs from 'qs';

export const DEFAULT_DEBUG_NODE_ENVS = ['test', 'development'];
export const DEFAULT_BUFFER_LIMIT = '500kB';
export const DEFAULT_PARSERS = {
  'application/json': content => JSON.parse(content),
  'text/plain': identity,
  'application/x-www-form-urlencoded': content => qs.parse(content),
};
export const DEFAULT_STRINGIFYERS = {
  'application/json': JSON.stringify.bind(JSON),
  'text/plain': ensureString,
  'application/x-www-form-urlencoded': qs.stringify.bind(qs),
};
export const DEFAULT_DECODERS = {
  'utf-8': PassThrough,
};
export const DEFAULT_ENCODERS = {
  'utf-8': PassThrough,
};

function ensureString(str) {
  return 'undefined' === typeof str
    ? ''
    : 'string' === typeof str
    ? str
    : JSON.stringify(str);
}

function identity(me) {
  return me;
}
