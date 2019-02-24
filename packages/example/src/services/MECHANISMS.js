import HTTPError from 'yhttperror';
import { name, autoService } from 'knifecycle';
import { BEARER as BEARER_MECHANISM } from 'http-auth-utils';

export const FAKE_MECHANISM = {
  type: 'Fake',
  parseAuthorizationRest: rest => {
    let userId;
    let scopes;

    rest.replace(/^(\d+)-((\w+,)*(\w+){1})$/, (_, rawUserId, rawScopes) => {
      userId = parseInt(rawUserId);
      scopes = rawScopes.split();
      return '';
    });

    if ('undefined' === typeof userId || 'undefined' === typeof scopes) {
      throw new HTTPError(400, 'E_INVALID_FAKE_TOKEN');
    }

    return {
      hash: rest,
      userId,
      scopes,
    };
  },
};

export default name('MECHANISMS', autoService(initMechanisms));

async function initMechanisms({ DEBUG_NODE_ENVS, NODE_ENV, log }) {
  log('debug', '🔧 - Initializing auth mechanisms');

  const debugging = DEBUG_NODE_ENVS.includes(NODE_ENV);
  const MECHANISMS = [BEARER_MECHANISM, ...(debugging ? [FAKE_MECHANISM] : [])];

  if (debugging) {
    log('warning', '⚠️ - Using fake auth mechanism!');
  }
  return MECHANISMS;
}
