import { autoService, location } from 'knifecycle';
import { type LogService, type TimeService } from 'common-services';
import {
  noop,
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import { YError, printStackTrace } from 'yerror';
import {
  type WhookOAuth2Options,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2ClientId,
} from '../services/oAuth2Granters.js';
import {
  DEFAULT_DEVICE_AUTHORIZATION_INTERVAL,
  DEVICE_AUTHORIZATION_GRANT_TYPE,
  type WhookOAuth2DeviceAuthorizationOptions,
  type WhookOAuth2DeviceAuthorizationCodeService,
} from '../services/oAuth2DeviceAuthorizationGranter.js';
import { checkGrants, toUsableClientId } from '../libs/clients.js';
import { checkGrantType } from '../libs/grants.js';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import { scopeSchema } from '../libs/schemas.js';
import { type WhookAuthenticationData } from '@whook/authorization';

export const userCodeSchema = {
  name: 'OAuth2UserCode',
  schema: {
    type: 'string',
  },
} as const satisfies WhookAPISchemaDefinition;
export const deviceCodeSchema = {
  name: 'OAuth2DeviceCode',
  schema: {
    type: 'string',
  },
} as const satisfies WhookAPISchemaDefinition;

export const deviceAuthorizationRequestBodySchema = {
  name: 'DeviceAuthorizationRequestBody',
  schema: {
    type: 'object',
    description:
      'Device authorization request, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.1',
    required: [],
    properties: {
      client_id: {
        type: 'string',
      },
      scope: refersTo(scopeSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/device_authorization',
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postOAuth2DeviceAuthorization',
    summary: `Implements the [Device Authorization Endpoint](https://datatracker.ietf.org/doc/html/rfc8628#section-3.1).`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: refersTo(deviceAuthorizationRequestBodySchema),
        },
        'application/json': {
          schema: refersTo(deviceAuthorizationRequestBodySchema),
        },
      },
    },
    responses: {
      '200': {
        description: 'Device authorization request accepted.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: [
                'device_code',
                'user_code',
                'verification_uri',
                'expires_in',
              ],
              properties: {
                device_code: refersTo(deviceCodeSchema),
                user_code: refersTo(userCodeSchema),
                verification_uri: {
                  type: 'string',
                  format: 'uri',
                },
                verification_uri_complete: {
                  type: 'string',
                  format: 'uri',
                },
                expires_in: {
                  type: 'number',
                },
                interval: {
                  type: 'number',
                  multipleOf: 1,
                  minimum: 1,
                },
                scope: refersTo(scopeSchema),
              },
            },
          },
        },
      },
      '400': {
        description:
          'OAuth2 device authorization error response, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.1.',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['error'],
              properties: {
                error: {
                  type: 'string',
                  enum: [
                    'invalid_request',
                    'invalid_client',
                    'unauthorized_client',
                    'invalid_scope',
                  ],
                },
                error_description: { type: 'string' },
                error_uri: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initPostOAuth2DeviceAuthorization({
  OAUTH2,
  OAUTH2_DEVICE_AUTHORIZATION,
  readClientGrants,
  oAuth2DeviceAuthorizationCode,
  time = Date.now.bind(Date),
  log = noop,
}: {
  OAUTH2: WhookOAuth2Options;
  OAUTH2_DEVICE_AUTHORIZATION: WhookOAuth2DeviceAuthorizationOptions;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2DeviceAuthorizationCode: Pick<WhookOAuth2DeviceAuthorizationCodeService, 'create'>;
  time: TimeService;
  log: LogService;
}) {
  return async ({
    body: { client_id: clientId, scope: demandedScope },
    authenticationData: optionalAuthenticationData,
  }: {
    body: {
      client_id?: WhookOAuth2ClientId;
      scope?: string;
    };
    authenticationData?: WhookAuthenticationData;
  }) => {
    try {
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

      const demandedScopes =
        typeof demandedScope === 'string'
          ? filterScopes(
              parseOAuth2Scope(demandedScope),
              OAUTH2.allowedScopes,
              !!OAUTH2.strictScopesChecks,
            )
          : [];
      const filteredScopes = filterScopes(
        demandedScopes.length
          ? demandedScopes
          : OAUTH2.defaultToClientScope
            ? grants.allowedScopes
            : [],
        grants.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      );
      const { deviceCode, userCode, expiresAt } = await oAuth2DeviceAuthorizationCode.create(
        optionalAuthenticationData || grants.authenticationData,
        {
          demandedScopes,
          filteredScopes,
        },
      );
      const currentTime = time();
      const completeURL = new URL(OAUTH2_DEVICE_AUTHORIZATION.verificationURI);

      completeURL.searchParams.append('userCode', userCode);

      return {
        status: 200,
        headers: {},
        body: {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: OAUTH2_DEVICE_AUTHORIZATION.verificationURI,
          verification_uri_complete: completeURL.toString(),
          expires_in: Math.ceil((expiresAt - currentTime) / 1000),
          interval:
            OAUTH2_DEVICE_AUTHORIZATION.interval ??
            DEFAULT_DEVICE_AUTHORIZATION_INTERVAL,
          ...(filteredScopes.length
            ? {
                scope: stringifyScopes(filteredScopes),
              }
            : {}),
        },
      };
    } catch (err) {
      log(
        'debug',
        '👫 - OAuth2 device authorization request error',
        (err as YError).code,
      );
      log('error-stack', printStackTrace(err));

      throw YError.cast(err as Error, 'E_OAUTH2_UNEXPECTED_ERROR');
    }
  };
}

export default location(
  autoService(initPostOAuth2DeviceAuthorization),
  import.meta.url,
);
