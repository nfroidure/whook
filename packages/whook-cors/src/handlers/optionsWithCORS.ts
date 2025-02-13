import { service, location } from 'knifecycle';
import { type WhookAPIHandler } from '@whook/whook';

/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export default location(
  service(initOptionsWithCORS, 'optionsWithCORS', []),
  import.meta.url,
);

async function initOptionsWithCORS() {
  const response = {
    status: 200,
  };

  return (async () => response) satisfies WhookAPIHandler;
}
