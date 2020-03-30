import { autoHandler } from 'knifecycle';

/**
 * A simple Whook handler that just returns a 200 OK
 *  HTTP response
 * @returns {Promise<Object>} The HTTP response object
 */
export default autoHandler(optionsWithCORS);

async function optionsWithCORS() {
  return {
    status: 200,
  };
}
