import {
  service,
  Parameters,
  Handler,
  HandlerFunction,
  Dependencies,
} from 'knifecycle';
import { LogService, TimeService, DelayService } from 'common-services';
import HTTPError from 'yhttperror';
import statuses from 'statuses';
import ms from 'ms';
import { IncomingMessage, ServerResponse } from 'http';
import { OpenAPIV3 } from 'openapi-types';

export type WhookOperation = OpenAPIV3.OperationObject & {
  path: string;
  method: string;
};

export type WhookRequest = {
  url: string;
  method: string;
  headers: { [name: string]: string };
  body?: any;
};

export type WhookResponse<
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

export type WhookHandlerFunction<
  D = Dependencies,
  R = WhookResponse,
  O = WhookOperation,
  P = Parameters
> = HandlerFunction<D, P, [O] | [], R>;

export type WhookHandler<
  R = WhookResponse,
  O = WhookOperation | undefined,
  P = Parameters
> = Handler<P, [O] | [], R>;

export type HTTPTransactionConfig = {
  TIMEOUT?: number;
  TRANSACTIONS?: {};
};
export type HTTPTransactionDependencies = HTTPTransactionConfig & {
  log?: LogService;
  time?: TimeService;
  delay: DelayService;
  uniqueId?: () => string;
};

export type WhookHTTPTransaction = {
  request: WhookRequest;
  transaction: {
    id: string;
    start: (buildResponse: Handler<any, any, any>) => Promise<WhookResponse>;
    catch: (err: Error) => Promise<WhookResponse>;
    end: (response: WhookResponse) => Promise<void>;
  };
};

export type HTTPTransactionService = (
  req: IncomingMessage,
  res: ServerResponse,
) => Promise<WhookHTTPTransaction>;

const noop = () => {};
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
  '?log',
  '?time',
  'delay',
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
async function initHTTPTransaction({
  TIMEOUT = DEFAULT_TIMEOUT,
  TRANSACTIONS,
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
        ([].concat(req.headers['x-forwarded-for'])[0] || '').split(',')[0] ||
        req.connection.remoteAddress,
      startInBytes: req.socket.bytesRead,
      startOutBytes: req.socket.bytesWritten,
      startTime: time(),
      url: req.url,
      method: req.method,
      reqHeaders: req.headers,
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
    { id, delayPromise },
    initializationPromise,
    buildResponse,
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
  async function catchTransaction({ id, req }, err) {
    /* Architecture Note #1.3: Transaction errors
  Here we are simply casting and logging errors.
   It is important for debugging but also for
   ending the transaction properly if an error
   occurs.
  */
    err = HTTPError.cast(err, err.httpCode || 500);
    log('error', 'An error occured', {
      guruMeditation: id,
      request:
        TRANSACTIONS[id].protocol +
        '://' +
        (req.headers.host || 'localhost') +
        TRANSACTIONS[id].url,
      verb: req.method,
      status: err.httpCode,
      code: err.code,
      stack: err.stack,
      details: err.params,
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
  async function endTransaction({ id, req, res, delayPromise }, response) {
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
          statuses[response.status],
          Object.assign({}, response.headers, { 'Transaction-Id': id }),
        );
        if (response.body && response.body.pipe) {
          response.body.pipe(res);
        } else {
          res.end();
        }
      });
    } catch (err) {
      TRANSACTIONS[id].errored = true;
      log('error', 'An error occured', {
        guruMeditation: id,
        request:
          TRANSACTIONS[id].protocol +
          '://' +
          (req.headers.host || 'localhost') +
          TRANSACTIONS[id].url,
        method: req.method,
        stack: err.stack || err,
      });
    }
    TRANSACTIONS[id].endTime = time();
    TRANSACTIONS[id].endInBytes = req.socket.bytesRead;
    TRANSACTIONS[id].endOutBytes = req.socket.bytesWritten;
    TRANSACTIONS[id].statusCode = response.status;
    TRANSACTIONS[id].resHeaders = response.headers || {};

    log('info', TRANSACTIONS[id]);

    delete TRANSACTIONS[id];

    try {
      await delay.clear(delayPromise);
    } catch (err) {
      log('debug', '❕ - Could not clear a delay.');
      log('debug-stack', err.stack);
    }
  }
}
