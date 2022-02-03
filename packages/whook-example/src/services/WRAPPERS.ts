import { service } from 'knifecycle';
import { wrapHandlerWithCORS } from '@whook/cors';
import { wrapHandlerWithAuthorization } from '@whook/authorization';
import type { Service, Dependencies } from 'knifecycle';
import type { WhookWrapper } from '@whook/whook';

export default service(initWrappers, 'WRAPPERS');

/* Architecture Note #4.6: WRAPPERS

Wrappers are allowing you to override every
 handlers of your API with specific behaviors,
 here we add CORS and HTTP authorization support
 to all the handlers defined in the API.
*/
async function initWrappers(): Promise<WhookWrapper<Dependencies, Service>[]> {
  const WRAPPERS = [
    wrapHandlerWithCORS,
    wrapHandlerWithAuthorization,
  ] as WhookWrapper<Dependencies, Service>[];

  return WRAPPERS;
}
