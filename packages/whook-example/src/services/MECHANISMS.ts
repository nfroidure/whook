import { YHTTPError } from 'yhttperror';
import { name, autoService, location } from 'knifecycle';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';
import { type AppEnvVars } from 'application-services';
import { type LogService } from 'common-services';
import {
  type WhookAuthenticationData,
  type WhookAuthenticationScope,
} from '@whook/authorization';
import { identity } from '@whook/whook';

export const FAKE_MECHANISM = {
  type: 'Fake',
  parseAuthorizationRest: (rest: string): WhookAuthenticationData => {
    let scopes: WhookAuthenticationScope[] = [];
    let clientId = '';
    let userId = '';

    rest.replace(
      /^([^|]*)\|([^|]+)\|([^|]+)$/,
      (_, _scope, _clientId, _userId) => {
        scopes = _scope ? _scope.split(' ').filter(identity) : [];
        clientId = _clientId;
        userId = _userId;
        return '';
      },
    );

    if (scopes?.length === 0) {
      throw new YHTTPError(400, 'E_INVALID_FAKE_TOKEN', [rest]);
    }

    return {
      clientId,
      scopes,
      userId,
    };
  },
};

/* Architecture Note #4.4: MECHANISMS

A service aimed to provide implementations for the
 various supported auth mechanisms.
*/
export default location(
  name('MECHANISMS', autoService(initMechanisms)),
  import.meta.url,
);

async function initMechanisms({
  ENV,
  log,
}: {
  ENV: AppEnvVars;
  log: LogService;
}) {
  log('debug', '🔧 - Initializing auth mechanisms');

  const debugging = !!ENV.DEV_MODE;
  const MECHANISMS = [BEARER_MECHANISM, ...(debugging ? [FAKE_MECHANISM] : [])];

  if (debugging) {
    log('warning', '⚠️ - Using fake auth mechanism!');
  }
  return MECHANISMS;
}
