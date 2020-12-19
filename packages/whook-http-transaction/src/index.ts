import { service } from 'knifecycle';
import HTTPError from 'yhttperror';
import statuses from 'statuses';
import ms from 'ms';
import initObfuscatorService from './services/obfuscator';
import initAPMService from './services/apm';
import type { Parameters, HandlerFunction, Dependencies } from 'knifecycle';
import type { LogService, TimeService, DelayService } from 'common-services';
import type { IncomingMessage, ServerResponse } from 'http';
import type { OpenAPIV3 } from 'openapi-types';
import type { JsonValue } from 'type-fest';
import type { Readable } from 'stream';
import type YError from 'yerror';
import type YHTTPError from 'yhttperror';
import type {
  ObfuscatorService,
  ObfuscatorConfig,
} from './services/obfuscator';
import type { APMService } from './services/apm';

export type { ObfuscatorConfig, ObfuscatorService, APMService };
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

export type WhookOperation<
  T = Record<string, unknown>
> = DereferencedOperationObject & {
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

export type WhookResponse<
  S = number,
  H = WhookHeaders,
  B = JsonValue | Readable
> = {
  status: S;
  headers?: H;
  body?: B;
};

export type WhookHandlerFunction<
  D extends Dependencies,
  V,
  P extends Parameters,
  R extends WhookResponse,
  O = WhookOperation
> = HandlerFunction<D, V, P, [O] | [], R>;

export type WhookHandler<
  P = Parameters,
  R = WhookResponse,
  O = WhookOperation
> = (parameters?: P, operation?: O) => Promise<R>;

export type HTTPTransactionConfig = {
  TIMEOUT?: number;
  TRANSACTIONS?: Record<string, Record<string, unknown>>;
};
export type HTTPTransactionDependencies = HTTPTransactionConfig & {
  obfuscator: ObfuscatorService;
  delay: DelayService;
  log?: LogService;
  apm?: APMService;
  time?: TimeService;
  uniqueId?: () => string;
};

export type WhookHTTPTransaction = {
  request: WhookRequest;
  transaction: {
    id: string;
    start: (buildResponse: WhookHandler) => Promise<WhookResponse>;
    catch: (err: Error) => Promise<WhookResponse>;
    end: (response: WhookResponse, operationId?: string) => Promise<void>;
  };
};

export type HTTPTransactionService = (
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
 *
 * const httpTransaction = await initHTTPTransaction({
 *   log: console.log.bind(console),
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
}: HTTPTransactionDependencies): Promise<HTTPTransactionService> {
  // Not using default value to always
  // get an empty object here and avoid
  // conflicts between instances spawned
  // with defaults
  TRANSACTIONS = TRANSACTIONS || {};

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
      url: req.url,
      method: req.method.toLowerCase(),
      headers: Object.keys(req.headers).reduce(
        (finalHeaders, name) => ({
          ...finalHeaders,
          [name]: [].concat(req.headers[name])[0],
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
          ([].concat(req.headers['x-forwarded-for'])[0] || '').split(',')[0] ||
        req.connection.remoteAddress,
      startInBytes: req.socket.bytesRead,
      startOutBytes: req.socket.bytesWritten,
      startTime: time(),
      url: req.url,
      method: req.method,
      reqHeaders: obfuscator.obfuscateSensibleHeaders(request.headers),
      errored: false,
    };
    const delayPromise = delay.create(TIMEOUT);
    /**
     * Id of the transaction
     * @memberof WhookHTTPTransaction
     * @name id
     */
    let id: string = [].concat(req.headers['transaction-id'])[0] || uniqueId();

    // Handle bad client transaction ids
    if (TRANSACTIONS[id]) {
      initializationPromise = Promise.reject(
        new HTTPError(400, 'E_TRANSACTION_ID_NOT_UNIQUE', id),
      );
      id = uniqueId();
    } else {
      initializationPromise = Promise.resolve();
    }

    transaction.id = id;
    TRANSACTIONS[id] = transaction;

    return {
      request,
      transaction: {
        id,
        start: startTransaction.bind(
          null,
          { id, req, res, delayPromise },
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
        throw new HTTPError(504, 'E_TRANSACTION_TIMEOUT', TIMEOUT, id);
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
        TRANSACTIONS[id].protocol +
        '://' +
        (req.headers.host || 'localhost') +
        TRANSACTIONS[id].url,
      verb: req.method,
      status: (err as YHTTPError).httpCode || 500,
      code: (err as YError).code || 'E_UNEXPECTED',
      stack: err.stack,
      details: (err as YError).params || [],
    });

    TRANSACTIONS[id].errored = true;

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
          Object.assign({}, response.headers, { 'Transaction-Id': id }),
        );
        if (response.body && (response.body as Readable).pipe) {
          (response.body as Readable).pipe(res);
        } else {
          res.end();
        }
      });
    } catch (err) {
      TRANSACTIONS[id].errored = true;
      apm('ERROR', {
        guruMeditation: id,
        request:
          TRANSACTIONS[id].protocol +
          '://' +
          (req.headers.host || 'localhost') +
          TRANSACTIONS[id].url,
        method: req.method,
        stack: err.stack || err,
        operationId,
      });
    }
    TRANSACTIONS[id].endTime = time();
    TRANSACTIONS[id].endInBytes = req.socket.bytesRead;
    TRANSACTIONS[id].endOutBytes = req.socket.bytesWritten;
    TRANSACTIONS[id].statusCode = response.status;
    TRANSACTIONS[id].resHeaders = response.headers || {};
    TRANSACTIONS[id].operationId = operationId;

    apm('CALL', TRANSACTIONS[id]);

    delete TRANSACTIONS[id];

    try {
      await delay.clear(delayPromise);
    } catch (err) {
      log('debug', '❕ - Could not clear a delay.');
      log('debug-stack', err.stack);
    }
  }
}
