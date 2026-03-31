import { PassThrough, type Transform } from 'node:stream';
import qs from 'qs';
import { type JsonValue } from 'type-fest';
import { type WhookRequestBodySpec } from './body.js';

export type WhookParser = (
  content: string,
  bodySpec?: WhookRequestBodySpec,
) => JsonValue;
export type WhookParsers = Record<string, WhookParser>;
export type WhookStringifyer = (content: string) => string;
export type WhookStringifiers = Record<string, WhookStringifyer>;
export type WhookEncoder<T extends Transform = Transform> = () => T;
export type WhookEncoders<T extends Transform = Transform> = Record<
  string,
  WhookEncoder<T>
>;
export type WhookDecoder<T extends Transform = Transform> = () => T;
export type WhookDecoders<T extends Transform = Transform> = Record<
  string,
  WhookDecoder<T>
>;

export const DEFAULT_DEBUG_NODE_ENVS = ['test', 'development'];
export const DEFAULT_BUFFER_LIMIT = '500kB';
export const DEFAULT_PARSERS = {
  'text/plain': (content: string): JsonValue => content,
  'application/json': (content: string): JsonValue => JSON.parse(content),
  'application/x-www-form-urlencoded': (content: string): JsonValue =>
    qs.parse(content) as JsonValue,
} satisfies WhookParsers;
export const DEFAULT_STRINGIFIERS = {
  'text/plain': ensureString,
  'application/json': (content: JsonValue): string => JSON.stringify(content),
  'application/x-www-form-urlencoded': (content: JsonValue): string =>
    qs.stringify(content),
} satisfies WhookStringifiers;
export const DEFAULT_DECODERS = {
  'utf-8': () => new PassThrough(),
} satisfies WhookDecoders;
export const DEFAULT_ENCODERS = {
  'utf-8': () => new PassThrough(),
} satisfies WhookEncoders;

function ensureString(maybeString: unknown): string {
  return 'undefined' === typeof maybeString
    ? ''
    : 'string' === typeof maybeString
      ? maybeString
      : JSON.stringify(maybeString);
}
