import HTTPError from 'yhttperror';
import { name, autoService } from 'knifecycle';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';

export const FAKE_MECHANISM = {
  type: 'Fake',
  parseAuthorizationRest: (
    rest: string,
  ): {
    scope: string;
    applicationId: string;
    userId: string;
  } => {
    let scope: string;
    let applicationId: string;
    let userId: string;

    rest.replace(
      /^([^|]*)\|([^|]+)\|([^|]+)$/,
      (_, _scope, _applicationId, _userId) => {
        scope = _scope;
        applicationId = _applicationId;
        userId = _userId;
        return '';
      },
    );

    if ('undefined' === typeof scope) {
      throw new HTTPError(400, 'E_INVALID_FAKE_TOKEN', rest);
    }

    return {
      applicationId,
      scope,
      userId,
    };
  },
};

/* Architecture Note #4.4: MECHANISMS

A service aimed to provide implementations for the
 various supported auth mechanisms.
*/
export default name('MECHANISMS', autoService(initMechanisms));

async function initMechanisms({ ENV, log }) {
  log('debug', '🔧 - Initializing auth mechanisms');

  const debugging = !!ENV.DEV_MODE;
  const MECHANISMS = [BEARER_MECHANISM, ...(debugging ? [FAKE_MECHANISM] : [])];

  if (debugging) {
    log('warning', '⚠️ - Using fake auth mechanism!');
  }
  return MECHANISMS;
}
