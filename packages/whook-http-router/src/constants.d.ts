/// <reference types="node" />
import { PassThrough } from 'stream';
export declare const DEFAULT_DEBUG_NODE_ENVS: string[];
export declare const DEFAULT_BUFFER_LIMIT = '500kB';
export declare const DEFAULT_PARSERS: {
  'application/json': (content: string) => any;
  'text/plain': (content: string) => any;
  'application/x-www-form-urlencoded': (content: string) => any;
};
export declare const DEFAULT_STRINGIFYERS: {
  'application/json': (content: any) => string;
  'text/plain': typeof ensureString;
  'application/x-www-form-urlencoded': (content: any) => string;
};
export declare const DEFAULT_DECODERS: {
  'utf-8': typeof PassThrough;
};
export declare const DEFAULT_ENCODERS: {
  'utf-8': typeof PassThrough;
};
declare function ensureString(maybeString: any): string;
export {};
