import { service, location } from 'knifecycle';
import { YHTTPError } from 'yhttperror';
import statuses from 'statuses';
import ms from 'ms';
import { type WhookObfuscatorService } from './obfuscator.js';
import { type WhookAPMService } from './apm.js';
import { printStackTrace, YError } from 'yerror';
import {
  type LogService,
  type TimeService,
  type DelayService,
} from 'common-services';
import { type IncomingMessage, type ServerResponse } from 'node:http';
import { type JsonValue } from 'type-fest';
import { type Readable } from 'node:stream';
import { pickFirstHeaderValue } from '../libs/headers.js';
import { type WhookRequest, type WhookResponse } from '../types/http.js';

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
    start: (
      buildResponse: () => Promise<WhookResponse>,
    ) => Promise<WhookResponse>;
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

/* Architecture Note #2.10: HTTP Transactions

[Whook](https://github.com/nfroidure/whook) takes a very
 unusual direction when it comes to dealing with HTTP
 transactions.
It makes requests and responses serializable (thanks to
 `WhookRequest` and `WhookResponse` types) to:

- only work with functions that take request and return
 responses (allowing your handlers to be pure functions),
- have  easily unit testable handlers thanks to concise
 snapshots.

This service is intended to build those literal objects 
 from Node HTTP ones (famously known as req/res) before
 passing them to the handlers. It also keeps track of
 running queries and ensure it is well handled by the
 server before releasing it. If not, the transaction is
 resolved with an error response (for timeouts or when
 an error were caught).

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
 the @whook/method-override` module for a working
 example.
 */
export default location(
  service(initHTTPTransaction, 'httpTransaction', [
    '?TIMEOUT',
    '?TRANSACTIONS',
    'delay',
    'obfuscator',
    '?log',
    '?apm',
    '?time',
    '?uniqueId',
  ]),
  import.meta.url,
);

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
 * A service to avoid logging sensible information
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
 * import initHTTPTransaction from '@whook/whook';
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

    /* Architecture Note #2.10.1: New Transaction
    The idea is to maintain a hash of each pending
     transaction. To do so, we create a transaction
     object that contains useful information about
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
    /* Architecture Note #2.10.2: Transaction start
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
    /* Architecture Note #2.10.3: Transaction errors
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
    /* Architecture Note #2.10.4: Transaction end
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
