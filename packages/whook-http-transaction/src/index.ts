import { service } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import statuses from 'statuses';
import ms from 'ms';
import initObfuscatorService, {
  type WhookObfuscatorService,
} from './services/obfuscator.js';
import initAPMService, { type WhookAPMService } from './services/apm.js';
import { printStackTrace, YError } from 'yerror';
import type { Parameters, HandlerFunction, Dependencies } from 'knifecycle';
import type { LogService, TimeService, DelayService } from 'common-services';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { OpenAPIV3 } from 'openapi-types';
import type { JsonValue } from 'type-fest';
import type { Readable } from 'stream';
export type {
  WhookObfuscatorDependencies,
  WhookSensibleValueDescriptor,
  WhookObfuscatorService,
  WhookObfuscatorConfig,
} from './services/obfuscator.js';
export type { WhookAPMDependencies, WhookAPMService } from './services/apm.js';

export { initObfuscatorService, initAPMService };

export type DereferencedMediaTypeObject = Omit<
  OpenAPIV3.MediaTypeObject,
  'schema'
> & {
  schema: OpenAPIV3.SchemaObject;
};
export type DereferencedResponseObject = Omit<
  OpenAPIV3.ResponseObject,
  'content'
> & {
  content?: {
    [media: string]: DereferencedMediaTypeObject;
  };
};
export type DereferencedRequestBodyObject = Omit<
  OpenAPIV3.RequestBodyObject,
  'content'
> & {
  content: {
    [media: string]: DereferencedMediaTypeObject;
  };
};
export type DereferencedParameterObject = Omit<
  OpenAPIV3.ParameterObject,
  'schema'
> & {
  schema: OpenAPIV3.SchemaObject;
};

export type DereferencedOperationObject = Omit<
  OpenAPIV3.OperationObject,
  'parameters' | 'requestBody' | 'responses'
> & {
  parameters: DereferencedParameterObject[];
  requestBody?: DereferencedRequestBodyObject;
  responses: {
    [code: string]: DereferencedResponseObject;
  };
};

export type WhookOperation<T = Record<string, unknown>> =
  DereferencedOperationObject & {
    operationId: string;
    path: string;
    method: string;
    'x-whook'?: T;
  };

export type WhookHeaders = Record<string, string | string[]>;

export type WhookRequest<H = WhookHeaders, B = JsonValue | Readable> = {
  url: string;
  method: string;
  headers: H;
  body?: B;
};

export declare type WhookResponse<
  S = number,
  H = WhookHeaders | void,
  B = JsonValue | Readable | void,
> = {
  status: S;
} & (H extends void
  ? {
      headers?: H;
    }
  : {
      headers: H;
    }) &
  (B extends void
    ? {
        body?: B;
      }
    : {
        body: B;
      });

// eslint-disable-next-line
export type WhookHandlerFunction<
  D extends Dependencies,
  P extends Parameters,
  R extends WhookResponse,
  O = WhookOperation,
> = HandlerFunction<
  D,
  P extends Parameters<infer V> ? V : never,
  P,
  [O] | [],
  R
>;

export interface WhookHandler<
  P = Parameters,
  R = WhookResponse,
  O = WhookOperation,
> {
  (parameters?: P, operation?: O): Promise<R>;
}

export type WhookHTTPTransactionConfig = {
  TIMEOUT?: number;
  TRANSACTIONS?: Record<string, Record<string, JsonValue>>;
};
export type HTTPTransactionDependencies = WhookHTTPTransactionConfig & {
  obfuscator: WhookObfuscatorService;
  delay: DelayService;
  log?: LogService;
  apm?: WhookAPMService;
  time?: TimeService;
  uniqueId?: () => string;
};

export type WhookHTTPTransaction = {
  request: WhookRequest;
  transaction: {
    id: string;
    start: (buildResponse: WhookHandler) => Promise<WhookResponse>;
    catch: (err: Error) => Promise<void>;
    end: (response: WhookResponse, operationId?: string) => Promise<void>;
  };
};

export type WhookHTTPTransactionService = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<WhookHTTPTransaction>;

const noop = () => undefined;
const DEFAULT_TIMEOUT = ms('30s');

function createIncrementor(n = 0) {
  return function increment() {
    return n++ + '';
  };
}

/* Architecture Note #1: HTTP Transactions

The `httpTransaction` service creates a new transaction
 for every single HTTP request incoming. It helps
 ensuring each request receives a response and avoid
 idle requests via a configurable timeout.

It is also a convenient abstraction of the actual
 request/response between the router and
 the NodeJS world. A common need is to fake the
 HTTP method for backward compatibility with old
 browsers/proxies by using the
 `X-HTTP-Method-Override` header.

You can simply do this by wrapping this service. See
 [`@whook/method-override`](../whook-method-override/README.md)
 for a working example.
 */
export default service(initHTTPTransaction, 'httpTransaction', [
  '?TIMEOUT',
  '?TRANSACTIONS',
  'delay',
  'obfuscator',
  '?log',
  '?apm',
  '?time',
  '?uniqueId',
]);

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
 * @param  {Object}     services.delay
 * A delaying service
 * @param  {Object}     services.obfuscator
 * A service to avoid logging sensible informations
 * @param  {Function}   [services.log]
 * A logging function
 * @param  {Function}   [services.apm]
 * An apm function
 * @param  {Function}   [services.time]
 * A timing function
 * @param  {Function}   [services.uniqueId]
 * A function returning unique identifiers
 * @return {Promise<WhookHTTPTransaction>}
 * A promise of the httpTransaction function
 * @example
 * import initHTTPTransaction from '@whook/http-transaction';
 * import { log } from 'node:console';
 *
 * const httpTransaction = await initHTTPTransaction({
 *   log,
 *   time: Date.now.bind(Date),
 * });
 */
async function initHTTPTransaction({
  TIMEOUT = DEFAULT_TIMEOUT,
  TRANSACTIONS,
  apm = noop,
  obfuscator,
  log = noop,
  time = Date.now.bind(Date),
  delay,
  uniqueId = createIncrementor(),
}: HTTPTransactionDependencies): Promise<WhookHTTPTransactionService> {
  // Not using default value to always
  // get an empty object here and avoid
  // conflicts between instances spawned
  // with defaults
  const FINAL_TRANSACTIONS: Record<
    string,
    Record<string, JsonValue>
  > = TRANSACTIONS || {};

  log('debug', '💱 - HTTP Transaction initialized.');

  return httpTransaction;

  /**
   * Create a new HTTP transaction
   * @function
   * @param  {HTTPRequest}  req
   * A raw NodeJS HTTP incoming message
   * @param  {HTTPResponse} res
   * A raw NodeJS HTTP response
   * @return {Array}
   * The normalized request and the HTTP
   * transaction created in an array.
   */
  async function httpTransaction(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<WhookHTTPTransaction> {
    let initializationPromise;

    /* Architecture Note #1.1: New Transaction
    The idea is to maintain a hash of each pending
     transaction. To do so, we create a transaction
     object that contains useful informations about
     the transaction and we store it into the
     `TRANSACTIONS` hash.

    Each transaction has a unique id that is either
     generated or picked up in the `Transaction-Id`
     request header. This allows to trace
     transactions end to end with that unique id.
    */
    const request = {
      url: req.url as string,
      method: (req.method as string).toLowerCase(),
      headers: Object.keys(req.headers).reduce(
        (finalHeaders, name) => ({
          ...finalHeaders,
          [name]: req.headers[name],
        }),
        {},
      ),
      body: req,
    };
    /**
    @typedef WhookHTTPTransaction
  */
    const transaction = {
      id: '',
      protocol: 'http',
      ip:
        '' +
          (pickFirstHeaderValue('x-forwarded-for', req.headers) || '').split(
            ',',
          )[0] ||
        req.socket.remoteAddress ||
        'unknown',
      startInBytes: req.socket.bytesRead,
      startOutBytes: req.socket.bytesWritten,
      startTime: time(),
      url: req.url as string,
      method: req.method as string,
      reqHeaders: obfuscator.obfuscateSensibleHeaders(request.headers),
      errored: false,
    };
    const delayPromise = delay.create(TIMEOUT);
    /**
     * Id of the transaction
     * @memberof WhookHTTPTransaction
     * @name id
     */
    let id: string =
      pickFirstHeaderValue('transaction-id', req.headers) || uniqueId();

    // Handle bad client transaction ids
    if (FINAL_TRANSACTIONS[id]) {
      initializationPromise = Promise.reject(
        new YHTTPError(400, 'E_TRANSACTION_ID_NOT_UNIQUE', id),
      );
      id = uniqueId();
    } else {
      initializationPromise = Promise.resolve();
    }

    transaction.id = id;
    FINAL_TRANSACTIONS[id] = transaction;

    return {
      request,
      transaction: {
        id,
        start: startTransaction.bind(
          null,
          { id, delayPromise },
          initializationPromise,
        ),
        catch: catchTransaction.bind(null, { id, req, res }),
        end: endTransaction.bind(null, { id, req, res, delayPromise }),
      },
    };
  }

  /**
   * Start the transaction
   * @memberof WhookHTTPTransaction
   * @name start
   * @param  {Function}   buildResponse
   * A function that builds a response
   * @return {Promise<Object>}
   * A promise to be resolved with the signed token.
   */
  async function startTransaction(
    { id, delayPromise }: { id: string; delayPromise: Promise<void> },
    initializationPromise: Promise<void>,
    buildResponse: () => Promise<WhookResponse>,
  ) {
    /* Architecture Note #1.2: Transaction start
  Once initiated, the transaction can be started. It
   basically spawns a promise that will be resolved
   to the actual response or rejected if the timeout
   is reached.
  */
    return Promise.race([
      initializationPromise.then(async () => buildResponse()),
      delayPromise.then(async () => {
        throw new YHTTPError(504, 'E_TRANSACTION_TIMEOUT', TIMEOUT, id);
      }),
    ]);
  }

  /**
   * Catch a transaction error
   * @memberof WhookHTTPTransaction
   * @name catch
   * @param  {Error}   err
   * A function that builds a response
   * @return {Promise}
   * A promise to be resolved with the signed token.
   */
  async function catchTransaction(
    { id, req }: { id: string; req: IncomingMessage },
    err: Error | YError | YHTTPError,
  ) {
    /* Architecture Note #1.3: Transaction errors
  Here we are simply logging errors.
   It is important for debugging but also for
   ending the transaction properly if an error
   occurs.
  */
    apm('ERROR', {
      guruMeditation: id,
      request:
        FINAL_TRANSACTIONS[id].protocol +
        '://' +
        (req.headers.host || 'localhost') +
        FINAL_TRANSACTIONS[id].url,
      verb: req.method as string,
      status: (err as YHTTPError).httpCode || 500,
      code: (err as YError).code || 'E_UNEXPECTED',
      stack: printStackTrace(err as Error),
      details: (err as YError).params || [],
    });

    FINAL_TRANSACTIONS[id].errored = true;

    throw err;
  }

  /**
   * End the transaction
   * @memberof WhookHTTPTransaction
   * @name end
   * @param  {Object}   response
   * A response for the transaction
   * @return {Promise<Object>}
   * A promise to be resolved with the signed token.
   */
  async function endTransaction(
    {
      id,
      req,
      res,
      delayPromise,
    }: {
      id: string;
      req: IncomingMessage;
      res: ServerResponse;
      delayPromise: Promise<void>;
    },
    response: WhookResponse,
    operationId = 'none',
  ): Promise<void> {
    /* Architecture Note #1.4: Transaction end
  We end the transaction by writing the final status
   and headers and piping the response body if any.

  The transaction can till error at that time but it
   is too late for changing the response status so
   we are just logging the event.
   This could be handled with
   [HTTP trailers](https://nodejs.org/api/http.html#http_response_addtrailers_headers)
   but the lack of client side support for now is
   preventing us to use them.

   Once terminated, the transaction is removed
    from the `TRANSACTIONS` hash.
  */
    try {
      await new Promise((resolve, reject) => {
        res.on('error', reject);
        res.on('finish', resolve);
        res.writeHead(
          response.status,
          statuses.message[response.status],
          Object.assign({}, response.headers || {}, { 'Transaction-Id': id }),
        );
        if (response.body && (response.body as Readable).pipe) {
          (response.body as Readable).pipe(res);
        } else {
          res.end();
        }
      });
    } catch (err) {
      FINAL_TRANSACTIONS[id].errored = true;
      apm('ERROR', {
        guruMeditation: id,
        request:
          FINAL_TRANSACTIONS[id].protocol +
          '://' +
          (req.headers.host || 'localhost') +
          FINAL_TRANSACTIONS[id].url,
        method: req.method as string,
        stack: printStackTrace(err as Error),
        operationId,
      });
    }
    FINAL_TRANSACTIONS[id].endTime = time();
    FINAL_TRANSACTIONS[id].endInBytes = req.socket.bytesRead;
    FINAL_TRANSACTIONS[id].endOutBytes = req.socket.bytesWritten;
    FINAL_TRANSACTIONS[id].statusCode = response.status;
    FINAL_TRANSACTIONS[id].resHeaders = response.headers || {};
    FINAL_TRANSACTIONS[id].operationId = operationId;

    apm('CALL', FINAL_TRANSACTIONS[id]);

    delete FINAL_TRANSACTIONS[id];

    try {
      await delay.clear(delayPromise);
    } catch (err) {
      log('debug', '❕ - Could not clear a delay.');
      log('debug-stack', printStackTrace(err as Error));
    }
  }
}

/**
 * Pick the first header value if exists
 * @function
 * @param  {string} name
 * The header name
 * @param  {Object} headers
 * The headers map
 * @return {string}
 * The value if defined.
 */
export function pickFirstHeaderValue(
  name: string,
  headers: IncomingMessage['headers'],
): string | undefined {
  return pickAllHeaderValues(name, headers)[0];
}

/**
 * Pick header values
 * @function
 * @param  {string} name
 * The header name
 * @param  {Object} headers
 * The headers map
 * @return {Array}
 * The values in an array.
 */
export function pickAllHeaderValues(
  name: string,
  headers: IncomingMessage['headers'],
): string[] {
  const headerValues: string[] =
    headers && typeof headers[name] === 'undefined'
      ? []
      : typeof headers[name] === 'string'
        ? [headers[name] as string]
        : (headers[name] as string[]);

  return headerValues;
}
