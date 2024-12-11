import Stream from 'node:stream';
import qs from 'qs';
import { type JsonValue } from 'type-fest';
import {
  type WhookDecoders,
  type WhookEncoders,
} from '../services/httpRouter.js';

export const DEFAULT_DEBUG_NODE_ENVS = ['test', 'development'];
export const DEFAULT_BUFFER_LIMIT = '500kB';
export const DEFAULT_PARSERS = {
  'application/json': (content: string): JsonValue => JSON.parse(content),
  'text/plain': (content: string): JsonValue => content,
  'application/x-www-form-urlencoded': (content: string): JsonValue =>
    qs.parse(content) as JsonValue,
};
export const DEFAULT_STRINGIFYERS = {
  'application/json': (content: JsonValue): string => JSON.stringify(content),
  'text/plain': ensureString,
  'application/x-www-form-urlencoded': (content: JsonValue): string =>
    qs.stringify(content),
};
export const DEFAULT_DECODERS = {
  'utf-8': Stream.PassThrough,
} as WhookDecoders<Stream.Transform>;
export const DEFAULT_ENCODERS = {
  'utf-8': Stream.PassThrough,
} as WhookEncoders<Stream.Transform>;

function ensureString(maybeString: unknown): string {
  return 'undefined' === typeof maybeString
    ? ''
    : 'string' === typeof maybeString
      ? maybeString
      : JSON.stringify(maybeString);
}
