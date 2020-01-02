/// <reference types="node" />
import { Parameters, Handler, HandlerFunction, Dependencies } from 'knifecycle';
import { LogService, TimeService, DelayService } from 'common-services';
import { IncomingMessage, ServerResponse } from 'http';
import { OpenAPIV3 } from 'openapi-types';
export declare type WhookOperation = OpenAPIV3.OperationObject & {
  path: string;
  method: string;
};
export declare type WhookRequest = {
  url: string;
  method: string;
  headers: {
    [name: string]: string;
  };
  body?: any;
};
export declare type WhookResponse<
  S = number,
  H = {
    [name: string]: string;
  },
  B = any
> = {
  status: S;
  headers?: H;
  body?: B;
};
export declare type WhookHandlerFunction<
  D = Dependencies,
  R = WhookResponse,
  O = WhookOperation,
  P = Parameters
> = HandlerFunction<D, P, [O] | [], R>;
export declare type WhookHandler<
  R = WhookResponse,
  O = WhookOperation | undefined,
  P = Parameters
> = Handler<P, [O] | [], R>;
export declare type HTTPTransactionConfig = {
  TIMEOUT?: number;
  TRANSACTIONS?: {};
};
export declare type HTTPTransactionDependencies = HTTPTransactionConfig & {
  log?: LogService;
  time?: TimeService;
  delay: DelayService;
  uniqueId?: () => string;
};
export declare type WhookHTTPTransaction = {
  request: WhookRequest;
  transaction: {
    id: string;
    start: (buildResponse: Handler<any, any, any>) => Promise<WhookResponse>;
    catch: (err: Error) => Promise<WhookResponse>;
    end: (response: WhookResponse) => Promise<void>;
  };
};
export declare type HTTPTransactionService = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<WhookHTTPTransaction>;
declare const _default: typeof initHTTPTransaction;
export default _default;
/**
 * Instantiate the httpTransaction service
 * @function
 * @param  {Object}     services
 * The services to inject
 * @param  {Number}     [services.TIMEOUT=30000]
 * A number indicating how many ms the transaction
 *  should take to complete before being cancelled.
 * @param  {Object}     [services.TRANSACTIONS={}]
 * A hash of every current transactions
 * @param  {Function}   [services.time]
 * A timing function
 * @param  {Object}     services.delay
 * A delaying service
 * @param  {Function}   [services.log]
 * A logging function
 * @param  {Function}   [services.uniqueId]
 * A function returning unique identifiers
 * @return {Promise<WhookHTTPTransaction>}
 * A promise of the httpTransaction function
 * @example
 * import initHTTPTransaction from '@whook/http-transaction';
 *
 * const httpTransaction = await initHTTPTransaction({
 *   log: console.log.bind(console),
 *   time: Date.now.bind(Date),
 * });
 */
declare function initHTTPTransaction({
  TIMEOUT,
  TRANSACTIONS,
  log,
  time,
  delay,
  uniqueId,
}: HTTPTransactionDependencies): Promise<HTTPTransactionService>;
