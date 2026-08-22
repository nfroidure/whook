import { autoService, location } from 'knifecycle';
import { noop, type WhookAPISchemaDefinition } from '@whook/whook';
import { pickYErrorWithCode, YError } from 'yerror';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2GranterService,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2ClientId,
} from './oAuth2Granters.js';
import {
  type WhookAuthenticationScope,
  type WhookAuthenticationData,
} from '@whook/authorization';
import { checkGrantType } from '../libs/grants.js';
import {
  checkClientsIds,
  checkGrants,
  toUsableClientId,
} from '../libs/clients.js';

export const DEVICE_AUTHORIZATION_GRANT_TYPE =
  'urn:ietf:params:oauth:grant-type:device_code';
export const DEFAULT_DEVICE_AUTHORIZATION_INTERVAL = 5;

export const deviceAuthorizationTokenRequestBodySchema = {
  name: 'DeviceAuthorizationTokenRequestBody',
  schema: {
    type: 'object',
    description:
      'Device authorization grant poll request, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.4',
    required: ['grant_type', 'device_code'],
    properties: {
      grant_type: {
        type: 'string',
        const: DEVICE_AUTHORIZATION_GRANT_TYPE,
      },
      device_code: {
        type: 'string',
      },
      client_id: {
        type: 'string',
      },
    },
  },
} as const satisfies WhookAPISchemaDefinition;

/**
 * A type allowing to override the device code type
 */
export type WhookOAuth2DeviceCode = string;

/**
 * A type allowing to override the user code type
 */
export type WhookOAuth2UserCode = string;

/**
 * A service to create and check device codes
 */
export interface WhookOAuth2DeviceAuthorizationCodeService {
  create: (
    clientAuthenticationData: WhookAuthenticationData,
    context: {
      demandedScopes: WhookAuthenticationScope[];
      filteredScopes: WhookAuthenticationScope[];
    },
  ) => Promise<{
    deviceCode: WhookOAuth2DeviceCode;
    userCode: WhookOAuth2UserCode;
    expiresAt: number;
  }>;
  acknowledge: (
    acknowledged: boolean,
    userAuthenticationData: WhookAuthenticationData,
    userCode: WhookOAuth2UserCode,
    acknowledgedScopes: WhookAuthenticationScope[],
  ) => Promise<void>;
  check: (
    clientAuthenticationData: WhookAuthenticationData,
    deviceCode: WhookOAuth2DeviceCode,
  ) => Promise<WhookAuthenticationData>;
}

export interface WhookOAuth2DeviceAuthorizationOptions {
  /** The interval the device may poll for a token */
  interval?: number;
  /** The user code verification interface URI */
  verificationURI: string;
}

export interface WhookOAuth2DeviceAuthorizationGranterDependencies {
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2DeviceAuthorizationCode: Pick<
    WhookOAuth2DeviceAuthorizationCodeService,
    'check'
  >;
  log?: LogService;
}

export interface WhookOAuth2DeviceAuthorizationGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof DEVICE_AUTHORIZATION_GRANT_TYPE;
  authenticateParameters: {
    deviceCode: string;
    clientId?: WhookOAuth2ClientId;
  };
}

export type WhookOAuth2DeviceAuthorizationGranterService =
  WhookOAuth2GranterService<WhookOAuth2DeviceAuthorizationGranterDefinitions>;

// Device Code Grant
// https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
async function initOAuth2DeviceAuthorizationGranter({
  readClientGrants,
  oAuth2DeviceAuthorizationCode,
  log = noop,
}: WhookOAuth2DeviceAuthorizationGranterDependencies): Promise<WhookOAuth2DeviceAuthorizationGranterService> {
  const authenticateWithDeviceCode: NonNullable<
    WhookOAuth2DeviceAuthorizationGranterService['authenticate']
  > = async ({ deviceCode, clientId }, optionalAuthenticationData) => {
    const usableClientId = toUsableClientId([
      optionalAuthenticationData?.clientId,
      clientId,
    ]);
    const grants = await readClientGrants(usableClientId);

    checkGrants(usableClientId, grants);

    if (!grants.isPublicClient) {
      if (!optionalAuthenticationData) {
        throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [
          grants.authenticationData.clientId,
        ]);
      }
    }

    checkGrantType(grants.allowedGrantTypes, DEVICE_AUTHORIZATION_GRANT_TYPE);

    try {
      const authorizationCodeAuthenticationData =
        await oAuth2DeviceAuthorizationCode.check(
          optionalAuthenticationData || grants.authenticationData,
          deviceCode,
        );

      checkClientsIds(usableClientId, [
        authorizationCodeAuthenticationData.clientId,
      ]);

      return authorizationCodeAuthenticationData;
    } catch (err) {
      const castedErr = pickYErrorWithCode(err as Error, 'E_BAD_TOKEN');

      if (castedErr) {
        throw YError.wrap(castedErr, 'E_OAUTH2_BAD_DEVICE_CODE');
      }

      const castedErr2 = pickYErrorWithCode(err as Error, 'E_EXPIRED_TOKEN');

      if (castedErr2) {
        throw YError.wrap(castedErr2, 'E_OAUTH2_EXPIRED_DEVICE_CODE');
      }
      throw err;
    }
  };

  log('debug', '👫 - OAuth2DeviceAuthorizationGranter Service Initialized!');

  return {
    grantType: DEVICE_AUTHORIZATION_GRANT_TYPE,
    issuesRefreshToken: true,
    authenticate: authenticateWithDeviceCode,
  };
}

export default location(
  autoService(initOAuth2DeviceAuthorizationGranter),
  import.meta.url,
);
