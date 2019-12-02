import { OpenAPIV3 } from 'openapi-types';
import {
  WhookRequest,
  WhookHandler,
  WhookOperation,
} from '@whook/http-transaction';
import { Parameters } from 'knifecycle';
export declare type BodySpec = {
  contentType: string;
  contentLength: number;
  charset: 'utf-8';
  boundary?: string;
};
export declare type ResponseSpec = {
  contentTypes: string[];
  charsets: string[];
};
export declare function extractConsumableMediaTypes(
  operation: OpenAPIV3.OperationObject,
): string[];
export declare function extractProduceableMediaTypes(
  operation: OpenAPIV3.OperationObject,
): string[];
export declare function extractBodySpec(
  request: WhookRequest,
  consumableMediaTypes: string[],
  consumableCharsets: string[],
): BodySpec;
export declare function checkBodyCharset(
  bodySpec: any,
  consumableCharsets: string[],
): void;
export declare function checkBodyMediaType(
  bodySpec: any,
  consumableMediaTypes: any,
): void;
export declare function extractResponseSpec(
  operation: OpenAPIV3.OperationObject,
  request: WhookRequest,
  supportedMediaTypes: string[],
  supportedCharsets: string[],
): ResponseSpec;
export declare function checkResponseMediaType(
  request: WhookRequest,
  responseSpec: ResponseSpec,
  produceableMediaTypes: string[],
): void;
export declare function checkResponseCharset(
  request: WhookRequest,
  responseSpec: ResponseSpec,
  produceableCharsets: string[],
): void;
export declare function executeHandler(
  operation: WhookOperation,
  handler: WhookHandler,
  parameters: Parameters,
): Promise<
  import('@whook/http-transaction').WhookResponse<
    number,
    {
      [name: string]: string;
    },
    any
  >
>;
