import { service } from 'knifecycle';
import { wrapHandlerWithCORS } from 'whook-cors';

export default service(initWrappers, 'WRAPPERS');

// Wrappers are allowing you to override every
// handlers of your API with specific behaviors,
// here we add CORS support
async function initWrappers() {
  const WRAPPERS = [wrapHandlerWithCORS];

  return WRAPPERS;
}
