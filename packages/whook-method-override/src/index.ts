import { wrapInitializer, alsoInject } from 'knifecycle';
import type { ServiceInitializer } from 'knifecycle';
import type { HTTPTransactionService } from '@whook/whook';
import type { LogService } from 'common-services';
import type { WhookHTTPTransaction } from '@whook/http-transaction';
import type { ServerResponse, IncomingMessage } from 'http';

/**
 * Wrap the Whook transaction service to handle method
 *  overriding (often needed for using the `patch` method).
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export default function wrapHTTPTransactionWithMethodOverride<D>(
  initHTTPTransaction: ServiceInitializer<D, HTTPTransactionService>,
): ServiceInitializer<D & { log: LogService }, HTTPTransactionService> {
  const augmentedInitializer = alsoInject<
    { log: LogService },
    D,
    HTTPTransactionService
  >(['log'], initHTTPTransaction);

  return wrapInitializer(
    async (
      services: { log: LogService } & D,
      httpTransaction: HTTPTransactionService,
    ) => {
      services.log(
        'debug',
        '🔧 - Wrapping transactions with methods override.',
      );
      return async (
        req: IncomingMessage,
        res: ServerResponse,
      ): Promise<WhookHTTPTransaction> => {
        const { request, transaction } = await httpTransaction(req, res);

        return {
          request: {
            ...request,
            method: request.headers['x-http-method-override']
              ? (
                  request.headers['x-http-method-override'] as string
                ).toLowerCase()
              : request.method,
            headers: Object.keys(request.headers)
              .filter((headerName) => 'x-http-method-override' === headerName)
              .reduce((newHeaders, headerName) => {
                newHeaders[headerName] = request.headers[headerName];
                return newHeaders;
              }, {}),
          },
          transaction,
        };
      };
    },
    augmentedInitializer,
  );
}
