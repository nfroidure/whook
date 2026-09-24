import { type JsonValue } from 'type-fest';
import { type Readable } from 'node:stream';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type Http2ServerRequest, type Http2ServerResponse } from 'node:http2';

export type WhookHeaders = Record<string, string | string[]>;
export type WhookRequestBody = JsonValue | Readable;
export type WhookResponseBody = JsonValue | Readable;
export type WhookNodeRequest = IncomingMessage | Http2ServerRequest;
export type WhookNodeResponse = ServerResponse | Http2ServerResponse;

export interface WhookRequest {
  url: string;
  method: string;
  headers: WhookHeaders;
  body?: WhookRequestBody;
}

export interface WhookResponse {
  status: number;
  headers?: WhookHeaders;
  body?: WhookResponseBody;
}
