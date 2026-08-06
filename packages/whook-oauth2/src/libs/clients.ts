import { identity } from '@whook/whook';
import { type WhookOAuth2ClientId } from '../services/oAuth2Granters.js';
import { YError } from 'yerror';

export function toUsableClientId(
  clientsIds: (WhookOAuth2ClientId | undefined)[],
): WhookOAuth2ClientId {
  const usableClientId = clientsIds.find(identity);

  if (!usableClientId) {
    throw new YError('E_OAUTH2_EMPTY_CLIENT', []);
  }

  if (clientsIds.some((clientId) => clientId && clientId !== usableClientId)) {
    throw new YError(
      'E_OAUTH2_CLIENT_MISMATCH',
      clientsIds.filter((clientId) => typeof clientId !== 'undefined'),
    );
  }

  return usableClientId;
}
