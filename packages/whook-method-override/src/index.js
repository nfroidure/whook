import { reuseSpecialProps, alsoInject } from 'knifecycle';

/**
 * Wrap the Whook transaction service to handle method
 *  overriding (often needed for using the `patch` method).
 * @param {Function} initHandler The handler initializer
 * @returns {Function} The handler initializer wrapped
 */
export default function wrapHTTPTransactionWithMethodOverride(
  initHTTPTransaction,
) {
  return alsoInject(
    ['log'],
    reuseSpecialProps(
      initHTTPTransaction,
      initHTTPTransactionWithMethodOverride.bind(null, initHTTPTransaction),
    ),
  );
}

async function initHTTPTransactionWithMethodOverride(
  initHTTPTransaction,
  { log, ...otherServices },
) {
  log('debug', '🔧 - Wrapping transactions with methods override.');

  const services = {
    log,
    ...otherServices,
  };
  const httpTransaction = await initHTTPTransaction(services);

  return async (...args) => {
    const [request, transaction] = await httpTransaction(...args);

    return [
      {
        ...request,
        method: request.headers['x-http-method-override']
          ? request.headers['x-http-method-override'].toLowerCase()
          : request.method,
        headers: Object.keys(request.headers)
          .filter(headerName => 'x-http-method-override' === headerName)
          .reduce((newHeaders, headerName) => {
            newHeaders[headerName] = request.headers[headerName];
            return newHeaders;
          }, {}),
      },
      transaction,
    ];
  };
}
