import { autoService, location } from 'knifecycle';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import {
  noop,
  refersTo,
  type WhookAPISchemaDefinition,
  type WhookRouteDefinition,
} from '@whook/whook';
import {
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2GranterService,
  type WhookOAuth2Options,
} from '../services/oAuth2Granters.js';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import {
  AUTHORIZATION_CODE_RESPONSE_TYPE,
  codeChallengeMethodSchema,
  codeChallengeSchema,
} from '../services/oAuth2AuthorizationCodeGranter.js';
import { IMPLICIT_RESPONSE_TYPE } from '../services/oAuth2ImplicitGranter.js';
import { scopeSchema, requestURISchema } from '../libs/schemas.js';
import {
  checkCodeChallengeParameters,
  PLAIN_CODE_CHALLENGE_METHOD,
} from '../libs/verifier.js';
import {
  DEFAULT_OAUTH2_PAR,
  type WhookOAuth2AuthorizationRequestsConfig,
  type WhookOAuth2AuthorizationRequestsService,
} from '../services/oAuth2AuthorizationRequests.js';
import { type WhookAuthenticationData } from '@whook/authorization';
import { toUsableClientId } from '../libs/clients.js';
import { getUsableRedirectURI } from '../libs/redirectURI.js';
import { type WhookOAuth2AuthorizeRequestParameters } from './getOAuth2Authorize.js';

export {
  scopeSchema,
  requestURISchema,
  codeChallengeSchema,
  codeChallengeMethodSchema,
};

export const pushedAuthorizationRequestBodySchema = {
  name: 'PushedAuthorizationRequestBody',
  schema: {
    description:
      'OAuth2 Pushed Authorization Request, see https://datatracker.ietf.org/doc/html/rfc9126#section-2.1.',
    type: 'object',
    required: ['response_type', 'client_id'],
    properties: {
      response_type: {
        type: 'string',
        enum: [AUTHORIZATION_CODE_RESPONSE_TYPE, IMPLICIT_RESPONSE_TYPE],
      },
      client_id: {
        type: 'string',
      },
      redirect_uri: {
        type: 'string',
        pattern: '^https?://',
        format: 'uri',
      },
      scope: refersTo(scopeSchema),
      state: {
        type: 'string',
      },
      code_challenge: refersTo(codeChallengeSchema),
      code_challenge_method: refersTo(codeChallengeMethodSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const definition = {
  method: 'post',
  path: '/oauth2/par',
  config: {
    environments: [],
  },
  operation: {
    operationId: 'postOAuth2PushedAuthorizationRequest',
    summary: `Implements the [Pushed Authorization Request Endpoint](https://datatracker.ietf.org/doc/html/rfc9126#section-2).`,
    tags: ['oauth2'],
    parameters: [],
    requestBody: {
      required: true,
      content: {
        'application/x-www-form-urlencoded': {
          schema: refersTo(pushedAuthorizationRequestBodySchema),
        },
        'application/json': {
          schema: refersTo(pushedAuthorizationRequestBodySchema),
        },
      },
    },
    responses: {
      '201': {
        description: 'Request URI created.',
        headers: {
          'cache-control': {
            schema: {
              type: 'string',
            },
          },
          pragma: {
            schema: {
              type: 'string',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['request_uri', 'expires_in'],
              properties: {
                request_uri: refersTo(requestURISchema),
                expires_in: {
                  type: 'number',
                },
              },
            },
          },
        },
      },
      '400': {
        description:
          'Request URI error response, see https://datatracker.ietf.org/doc/html/rfc9126#section-2.3.',
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
                    'invalid_scope',
                    'invalid_client',
                    'unauthorized_client',
                    'unsupported_response_type',
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

async function initPostOAuth2PushedAuthorizationRequest({
  OAUTH2,
  OAUTH2_PAR = DEFAULT_OAUTH2_PAR,
  oAuth2Granters,
  oAuth2AuthorizationRequests,
  readClientGrants,
  log = noop,
}: WhookOAuth2AuthorizationRequestsConfig & {
  OAUTH2: WhookOAuth2Options;
  oAuth2Granters: WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];
  oAuth2AuthorizationRequests: Pick<
    WhookOAuth2AuthorizationRequestsService,
    'create'
  >;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  log?: LogService;
}) {
  if (OAUTH2_PAR.mode === 'disabled') {
    log('error', `💥 - OAuth2 PAR endpoint should be disabled when PAR is.`);
    throw new YError('E_OAUTH2_MISCONFIGURED');
  }

  return async ({
    body: {
      response_type: responseType,
      client_id: givenClientId,
      redirect_uri: demandedRedirectURI = '',
      scope: demandedScope = '',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      request_uri: requestURI,
    },
    authenticationData: optionalAuthenticationData,
  }: {
    body: WhookOAuth2AuthorizeRequestParameters & {
      request_uri?: string;
    } & Record<string, string>;
    authenticationData?: WhookAuthenticationData;
  }) => {
    const usableClientId = toUsableClientId([
      optionalAuthenticationData?.clientId,
      givenClientId,
    ]);

    const clientGrants = await readClientGrants(usableClientId);

    if (usableClientId !== clientGrants.authenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
        usableClientId,
        clientGrants.authenticationData.clientId,
      ]);
    }

    if (!clientGrants.isPublicClient) {
      if (!optionalAuthenticationData) {
        throw new YError('E_OAUTH2_AUTHENTICATION_REQUIRED', [usableClientId]);
      }
    }

    const usableRedirectURI = getUsableRedirectURI(
      clientGrants.allowedRedirectURIS,
      demandedRedirectURI,
    );
    const demandedScopes = filterScopes(
      filterScopes(
        parseOAuth2Scope(demandedScope),
        OAUTH2.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      ),
      clientGrants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    if (requestURI) {
      throw new YError('E_OAUTH2_REQUEST_URI_NOT_ALLOWED');
    }

    checkCodeChallengeParameters(responseType, codeChallenge, OAUTH2.forcePKCE);

    const granter = oAuth2Granters.find(
      (granter) => granter.responseType === responseType,
    );

    if (!granter?.authorize) {
      throw new YError('E_OAUTH2_UNKNOWN_RESPONSE_TYPE', [responseType]);
    }

    const { scopes } = await granter.authorize({
      clientId: usableClientId,
      clientGrants,
      demandedScopes,
    });

    const paramsHash: WhookOAuth2AuthorizeRequestParameters = {
      response_type: responseType,
      redirect_uri: usableRedirectURI,
      scope: stringifyScopes(scopes),
      client_id: usableClientId,
    };

    if (responseType === AUTHORIZATION_CODE_RESPONSE_TYPE && codeChallenge) {
      paramsHash.code_challenge = codeChallenge;
      paramsHash.code_challenge_method =
        codeChallengeMethod || PLAIN_CODE_CHALLENGE_METHOD;
    }

    if (state) {
      paramsHash.state = state;
    }

    const { requestURI: pushedRequestURI, expiresIn } =
      await oAuth2AuthorizationRequests.create(usableClientId, paramsHash);

    return {
      status: 201,
      headers: {
        'cache-control': 'no-store',
        pragma: 'no-cache',
      },
      body: {
        request_uri: pushedRequestURI,
        expires_in: Math.floor(expiresIn / 1000),
      },
    };
  };
}

export default location(
  autoService(initPostOAuth2PushedAuthorizationRequest),
  import.meta.url,
);
