import { YError } from 'yerror';

export type WhookOAuth2GrantType = string;

export function checkGrantType(
  allowedGrantTypes: WhookOAuth2GrantType[],
  demandedGrantType: WhookOAuth2GrantType,
) {
  if (!allowedGrantTypes.includes(demandedGrantType)) {
    throw new YError('E_OAUTH2_GRANT_TYPE_NOT_ALLOWED', [
      demandedGrantType,
      allowedGrantTypes,
    ]);
  }
}
