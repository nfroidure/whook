import { identity } from '@whook/whook';
import {
  type WhookOAuth2ClientGrants,
  type WhookOAuth2ClientId,
} from '../services/oAuth2Granters.js';
import { YError } from 'yerror';

export function checkClientsIds(
  usedClientId: WhookOAuth2ClientId,
  clientsIds: (WhookOAuth2ClientId | undefined)[],
) {
  if (clientsIds.some((clientId) => clientId && clientId !== usedClientId)) {
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

export function toUsableClientId(
  clientsIds: (WhookOAuth2ClientId | undefined)[],
): WhookOAuth2ClientId {
  const usableClientId = clientsIds.find(identity);

  if (!usableClientId) {
    throw new YError('E_OAUTH2_EMPTY_CLIENT', []);
  }

  checkClientsIds(usableClientId, clientsIds);

  return usableClientId;
}
