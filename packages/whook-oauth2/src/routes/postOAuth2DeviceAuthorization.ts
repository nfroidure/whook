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
  DEVICE_CODE_GRANT_TYPE,
  type WhookOAuth2DeviceCodeService,
} from '../services/oAuth2DeviceCodeGranter.js';
import { toUsableClientId } from '../libs/clients.js';
import { checkGrantType } from '../libs/grants.js';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import { scopeSchema } from '../libs/schemas.js';
import { type WhookAuthenticationData } from '@whook/authorization';

export const deviceAuthorizationRequestBodySchema = {
  name: 'DeviceAuthorizationRequestBody',
  schema: {
    type: 'object',
    description:
      'Device authorization request, see https://datatracker.ietf.org/doc/html/rfc8628#section-3.1',
    required: ['client_id'],
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
                device_code: {
                  type: 'string',
                },
                user_code: {
                  type: 'string',
                },
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
  readClientGrants,
  oAuth2DeviceCode,
  time = Date.now.bind(Date),
  log = noop,
}: {
  OAUTH2: WhookOAuth2Options;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2DeviceCode: Pick<WhookOAuth2DeviceCodeService, 'create'>;
  time: TimeService;
  log: LogService;
}) {
  return async ({
    body: { client_id: clientId, scope: demandedScope },
    authenticationData: optionalAuthenticationData,
  }: {
    body: {
      client_id: WhookOAuth2ClientId;
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
      const {
        deviceCode,
        userCode,
        verificationURI,
        verificationURIComplete,
        expiresAt,
        interval,
      } = await oAuth2DeviceCode.create(
        optionalAuthenticationData || grants.authenticationData,
        {
          demandedScopes,
          filteredScopes,
        },
      );
      const currentTime = time();

      return {
        status: 200,
        headers: {},
        body: {
          device_code: deviceCode,
          user_code: userCode,
          verification_uri: verificationURI,
          ...(verificationURIComplete
            ? {
                verification_uri_complete: verificationURIComplete,
              }
            : {}),
          expires_in: Math.ceil((expiresAt - currentTime) / 1000),
          interval: interval || 5,
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
