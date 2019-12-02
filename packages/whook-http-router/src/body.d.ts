/// <reference types="node" />
import Stream from 'stream';
import { WhookOperation } from '@whook/http-transaction';
import { BodySpec } from './lib';
export declare function getBody(
  {
    DECODERS,
    PARSERS,
    bufferLimit,
  }: {
    DECODERS: any;
    PARSERS: any;
    bufferLimit: any;
  },
  operation: WhookOperation,
  inputStream: Stream.Readable,
  bodySpec: BodySpec,
): Promise<Stream.Readable | {} | void>;
export declare function sendBody(
  {
    ENCODERS,
    STRINGIFYERS,
  }: {
    ENCODERS: any;
    STRINGIFYERS: any;
  },
  response: any,
): Promise<any>;
