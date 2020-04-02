import stream from 'stream';
import qs from 'qs';

export const DEFAULT_DEBUG_NODE_ENVS = ['test', 'development'];
export const DEFAULT_BUFFER_LIMIT = '500kB';
export const DEFAULT_PARSERS = {
  'application/json': (content: string): any => JSON.parse(content),
  'text/plain': (content: string): any => content,
  'application/x-www-form-urlencoded': (content: string): any =>
    qs.parse(content),
};
export const DEFAULT_STRINGIFYERS = {
  'application/json': (content: any): string => JSON.stringify(content),
  'text/plain': ensureString,
  'application/x-www-form-urlencoded': (content: any): string =>
    qs.stringify(content),
};
export const DEFAULT_DECODERS = {
  'utf-8': stream.PassThrough,
};
export const DEFAULT_ENCODERS = {
  'utf-8': stream.PassThrough,
};

function ensureString(maybeString: any): string {
  return 'undefined' === typeof maybeString
    ? ''
    : 'string' === typeof maybeString
    ? maybeString
    : JSON.stringify(maybeString);
}
