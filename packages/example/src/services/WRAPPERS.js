import { service } from 'knifecycle';
import { wrapHandlerWithCORS } from 'whook-cors';
import { wrapHandlerWithAuthorization } from 'whook-authorization';

export default service(initWrappers, 'WRAPPERS');

// Wrappers are allowing you to override every
// handlers of your API with specific behaviors,
// here we add CORS and HTTP authorization support
async function initWrappers() {
  const WRAPPERS = [wrapHandlerWithCORS, wrapHandlerWithAuthorization];

  return WRAPPERS;
}
