import { type JsonValue } from 'type-fest';
import { type Readable } from 'node:stream';

export type WhookHeaders = Record<string, string | string[]>;
export type WhookRequestBody = JsonValue | Readable;
export type WhookResponseBody = JsonValue | Readable;

export type WhookRequest = {
  url: string;
  method: string;
  headers: WhookHeaders;
  body?: WhookRequestBody;
};

export type WhookResponse = {
  status: number;
  headers?: WhookHeaders;
  body?: WhookResponseBody;
};
