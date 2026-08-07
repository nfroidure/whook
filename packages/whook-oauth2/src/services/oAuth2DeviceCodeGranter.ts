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
import { type WhookAuthenticationData } from '@whook/authorization';
import { checkGrantType } from '../libs/grants.js';
import { toUsableClientId } from '../libs/clients.js';

export const DEVICE_CODE_GRANT_TYPE =
  'urn:ietf:params:oauth:grant-type:device_code';

export const deviceCodeTokenRequestBodySchema = {
  name: 'DeviceCodeRequestBody',
  schema: {
    type: 'object',
    description:
      'Device authorization grant poll request, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.4',
    required: ['grant_type', 'device_code'],
    properties: {
      grant_type: {
        type: 'string',
        const: DEVICE_CODE_GRANT_TYPE,
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
 * A service to create and check device codes
 */
export interface WhookOAuth2DeviceCodeService {
  create: (
    clientAuthenticationData: WhookAuthenticationData,
    context: {
      demandedScopes: string[];
      filteredScopes: string[];
    },
  ) => Promise<{
    deviceCode: WhookOAuth2DeviceCode;
    userCode: string;
    verificationURI: string;
    verificationURIComplete?: string;
    expiresAt: number;
    interval?: number;
  }>;
  check: (
    clientAuthenticationData: WhookAuthenticationData,
    deviceCode: WhookOAuth2DeviceCode,
  ) => Promise<WhookAuthenticationData>;
}

export interface WhookOAuth2DeviceCodeGranterDependencies {
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2DeviceCode: Pick<WhookOAuth2DeviceCodeService, 'check'>;
  log?: LogService;
}

export interface WhookOAuth2DeviceCodeGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof DEVICE_CODE_GRANT_TYPE;
  authenticateParameters: {
    deviceCode: string;
    clientId?: WhookOAuth2ClientId;
  };
}

export type WhookOAuth2DeviceCodeGranterService =
  WhookOAuth2GranterService<WhookOAuth2DeviceCodeGranterDefinitions>;

// Device Code Grant
// https://datatracker.ietf.org/doc/html/rfc8628#section-3.4
async function initOAuth2DeviceCodeGranter({
  readClientGrants,
  oAuth2DeviceCode,
  log = noop,
}: WhookOAuth2DeviceCodeGranterDependencies): Promise<WhookOAuth2DeviceCodeGranterService> {
  const authenticateWithDeviceCode: NonNullable<
    WhookOAuth2DeviceCodeGranterService['authenticate']
  > = async ({ deviceCode, clientId }, optionalAuthenticationData) => {
    const usableClientId = toUsableClientId([
      optionalAuthenticationData?.clientId,
      clientId,
    ]);
    const grants = await readClientGrants(usableClientId);

    if (usableClientId !== grants.authenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
        usableClientId,
        grants.authenticationData.clientId,
      ]);
    }

    if (!grants.isPublicClient) {
      if (!optionalAuthenticationData) {
        throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [
          grants.authenticationData.clientId,
        ]);
      }
    }

    checkGrantType(grants.allowedGrantTypes, DEVICE_CODE_GRANT_TYPE);

    try {
      return await oAuth2DeviceCode.check(
        optionalAuthenticationData || grants.authenticationData,
        deviceCode,
      );
    } catch (err) {
      const castedErr = pickYErrorWithCode(err as Error, 'E_BAD_TOKEN');

      if (castedErr) {
        throw YError.wrap(castedErr, 'E_OAUTH2_BAD_DEVICE_CODE');
      }
      throw err;
    }
  };

  log('debug', '👫 - OAuth2DeviceCodeGranter Service Initialized!');

  return {
    grantType: DEVICE_CODE_GRANT_TYPE,
    issuesRefreshToken: true,
    authenticate: authenticateWithDeviceCode,
  };
}

export default location(
  autoService(initOAuth2DeviceCodeGranter),
  import.meta.url,
);
