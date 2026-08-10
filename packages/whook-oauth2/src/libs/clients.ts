import {
  type WhookOAuth2ClientGrants,
  type WhookOAuth2ClientId,
} from '../services/oAuth2Granters.js';
import { YError } from 'yerror';

/**
 * Verifies that every defined client ids are the same.
 *  Some may be undefined since sometimes several sources
 *  can be used but ain't necessary defined. We just need
 *  to ensure every clients ids that could have been used
 *  are equal.
 * @param usedClientId The usaed client id
 * @param clientsIds All candidates ids from different sources
 */
export function checkClientsIds(
  usedClientId: WhookOAuth2ClientId,
  clientsIds: (WhookOAuth2ClientId | undefined)[],
) {
  if (clientsIds.some((clientId) => clientId === '')) {
    throw new YError('E_OAUTH2_UNEXPECTED_EMPTY_CLIENT_ID', []);
  }

  if (
    clientsIds.some(
      (clientId) =>
        typeof clientId !== 'undefined' && clientId !== usedClientId,
    )
  ) {
    throw new YError('E_OAUTH2_CLIENT_MISMATCH', [
      usedClientId,
      ...clientsIds.filter((clientId) => typeof clientId !== 'undefined'),
    ]);
  }
}

export function checkGrants(
  clientId: WhookOAuth2ClientId,
  grants: WhookOAuth2ClientGrants,
) {
  if (clientId !== grants.authenticationData.clientId) {
    throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
      clientId,
      grants.authenticationData.clientId,
    ]);
  }
}

/**
 * Pick a usable client id from different sources
 * @param clientsIds Every candidates clients ids
 * @returns A usable client id
 */
export function toUsableClientId(
  clientsIds: (WhookOAuth2ClientId | undefined)[],
): WhookOAuth2ClientId {
  if (clientsIds.some((clientId) => clientId === '')) {
    throw new YError('E_OAUTH2_UNEXPECTED_EMPTY_CLIENT_ID', []);
  }

  const usableClientId = clientsIds.find(
    (clientId) => typeof clientId !== 'undefined',
  );

  if (typeof usableClientId === 'undefined') {
    throw new YError('E_OAUTH2_EMPTY_CLIENT', []);
  }

  checkClientsIds(usableClientId, clientsIds);

  return usableClientId;
}
