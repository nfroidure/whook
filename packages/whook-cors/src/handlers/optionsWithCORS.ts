import { handler, location } from 'knifecycle';

/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export default location(
  handler(optionsWithCORS, 'optionsWithCORS', []),
  import.meta.url,
);

async function optionsWithCORS() {
  return {
    status: 200,
  };
}
