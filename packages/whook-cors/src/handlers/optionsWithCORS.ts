import { handler } from 'knifecycle';

/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export default handler(optionsWithCORS, 'optionsWithCORS', []);

async function optionsWithCORS() {
  return {
    status: 200,
  };
}
