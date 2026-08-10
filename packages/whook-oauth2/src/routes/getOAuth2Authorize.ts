import { autoService, location } from 'knifecycle';
import { YError, printStackTrace } from 'yerror';
import {
  refersTo,
  type WhookRouteDefinition,
  type WhookAPIParameterDefinition,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import {
  type WhookOAuth2Options,
  type WhookOAuth2GranterService,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2ReadClientGrantsService,
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import {
  checkCodeChallengeParameters,
  type CodeChallengeMethod,
  PLAIN_CODE_CHALLENGE_METHOD,
} from '../libs/verifier.js';
import {
  AUTHORIZATION_CODE_RESPONSE_TYPE,
  codeChallengeMethodSchema,
  codeChallengeMethodParameter,
  codeChallengeSchema,
  codeChallengeParameter,
} from '../services/oAuth2AuthorizationCodeGranter.js';
import { IMPLICIT_RESPONSE_TYPE } from '../services/oAuth2ImplicitGranter.js';
import {
  addParamsToURL,
  buildParamsFromError,
  getUsableRedirectURI,
} from '../libs/redirectURI.js';
import { requestURISchema, scopeSchema } from '../libs/schemas.js';
import {
  DEFAULT_OAUTH2_PAR,
  type WhookOAuth2AuthorizationRequestsConfig,
  type WhookOAuth2AuthorizationRequestsService,
} from '../services/oAuth2AuthorizationRequests.js';
import { isRequestURI } from '../libs/authorizationRequests.js';
import { toUsableClientId } from '../libs/clients.js';

export {
  requestURISchema,
  scopeSchema,
  codeChallengeMethodSchema,
  codeChallengeMethodParameter,
  codeChallengeSchema,
  codeChallengeParameter,
};

export interface WhookOAuth2AuthorizeRequestParameters {
  client_id: string;
  response_type: string;
  redirect_uri?: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: CodeChallengeMethod;
}

/* Architecture Note #1: OAuth2 authorize

This endpoint simply redirects the user to the authentication
 server page and checks the application details are
 fine.

*/

export const responseTypeParameter = {
  name: 'responseType',
  parameter: {
    in: 'query',
    name: 'response_type',
    required: false,
    schema: {
      type: 'string',
      enum: [AUTHORIZATION_CODE_RESPONSE_TYPE, IMPLICIT_RESPONSE_TYPE],
    },
  },
} as const satisfies WhookAPIParameterDefinition;
export const clientIdParameter = {
  name: 'clientId',
  parameter: {
    in: 'query',
    name: 'client_id',
    required: true,
    schema: {
      type: 'string',
    },
  },
} as const satisfies WhookAPIParameterDefinition;
export const redirectURIParameter = {
  name: 'redirectURI',
  parameter: {
    in: 'query',
    name: 'redirect_uri',
    required: false,
    schema: {
      type: 'string',
      pattern: '^https?://',
      format: 'uri',
    },
  },
} as const satisfies WhookAPIParameterDefinition;
export const scopeParameter = {
  name: 'scope',
  parameter: {
    in: 'query',
    name: 'scope',
    required: false,
    schema: refersTo(scopeSchema),
  },
} as const satisfies WhookAPIParameterDefinition;
export const stateParameter = {
  name: 'state',
  parameter: {
    in: 'query',
    name: 'state',
    required: false,
    schema: {
      type: 'string',
    },
  },
} as const satisfies WhookAPIParameterDefinition;
export const requestURIParameter = {
  name: 'requestURI',
  parameter: {
    in: 'query',
    name: 'request_uri',
    required: false,
    schema: refersTo(requestURISchema),
  },
} as const satisfies WhookAPIParameterDefinition;

export const definition = {
  method: 'get',
  path: '/oauth2/authorize',
  operation: {
    operationId: 'getOAuth2Authorize',
    summary: `Implements the [Authorization Endpoint](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#section-3.1)
 as defined per the OAuth2.1 RFC.`,
    tags: ['oauth2'],
    parameters: [
      refersTo(responseTypeParameter),
      refersTo(clientIdParameter),
      refersTo(redirectURIParameter),
      refersTo(scopeParameter),
      refersTo(stateParameter),
      refersTo(requestURIParameter),
      refersTo(codeChallengeParameter),
      refersTo(codeChallengeMethodParameter),
    ],
    responses: {
      '302': {
        description: 'Redirects the user to the authorization interface.',
      },
    },
  },
} as const satisfies WhookRouteDefinition;

async function initGetOAuth2Authorize({
  OAUTH2,
  OAUTH2_PAR = DEFAULT_OAUTH2_PAR,
  ERRORS_DESCRIPTORS,
  oAuth2Granters,
  oAuth2AuthorizationRequests = undefined,
  readClientGrants,
  log,
}: WhookOAuth2AuthorizationRequestsConfig & {
  OAUTH2: WhookOAuth2Options;
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
  oAuth2Granters: WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  oAuth2AuthorizationRequests?: Pick<
    WhookOAuth2AuthorizationRequestsService,
    'check'
  >;
  log: LogService;
}) {
  if (OAUTH2_PAR?.mode !== 'disabled' && !oAuth2AuthorizationRequests) {
    log('error', `💥 - OAuth2 PAR endpoint required to enable PAR.`);
    throw new YError('E_OAUTH2_MISCONFIGURED');
  }

  return async ({
    query: { client_id: givenClientId, request_uri: requestURI, ...query },
  }: {
    query: {
      client_id: string;
      request_uri?: string;
    } & Partial<Omit<WhookOAuth2AuthorizeRequestParameters, 'client_id'>>;
  }) => {
    let usableRedirectURI: string | undefined = undefined;
    let finalQuery: WhookOAuth2AuthorizeRequestParameters | undefined =
      undefined;

    // If everything goes well we proxy the request
    // to the authentication server for acknowledgment
    let url = new URL(OAUTH2.authenticateURL);

    try {
      const clientGrants = await readClientGrants(givenClientId);

      if (givenClientId !== clientGrants.authenticationData.clientId) {
        throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
          givenClientId,
          clientGrants.authenticationData.clientId,
        ]);
      }

      // Default to client URI to redirect errors
      // before the request URI is decoded
      usableRedirectURI = clientGrants.allowedRedirectURIS[0];

      if (OAUTH2_PAR.mode === 'required' && !requestURI) {
        throw new YError('E_OAUTH2_PAR_REQUIRED');
      }

      if (OAUTH2_PAR.mode === 'disabled' && requestURI) {
        throw new YError('E_OAUTH2_PAR_NOT_SUPPORTED');
      }

      if (requestURI && isRequestURI(requestURI)) {
        if (
          Object.keys(query)
            .filter(
              (key) =>
                typeof (query as Record<string, unknown>)[key] !== 'undefined',
            )
            .some((key) => !['client_id', 'request_uri'].includes(key))
        ) {
          throw new YError(
            'E_OAUTH2_BAD_REQUEST_URI_PARAMETERS',
            Object.keys(query),
          );
        }

        const result = await oAuth2AuthorizationRequests?.check(
          givenClientId,
          requestURI,
        );

        if (!result) {
          throw new YError('E_OAUTH2_BAD_REQUEST_URI', [
            requestURI,
            undefined,
            undefined,
          ]);
        }

        finalQuery = {
          ...result?.parameters,
          client_id: toUsableClientId([
            givenClientId,
            result.parameters.client_id,
          ]),
        };
      } else {
        const responseType = query.response_type;

        if (!responseType) {
          throw new YError('E_OAUTH2_UNKNOWN_RESPONSE_TYPE', [responseType]);
        }

        finalQuery = {
          ...query,
          client_id: givenClientId,
          response_type: responseType,
        };
      }

      const {
        response_type: responseType,
        redirect_uri: demandedRedirectURI,
        scope: demandedScope = '',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: codeChallengeMethod,
      } = finalQuery;

      // Have a valid redirect URI asap
      usableRedirectURI = getUsableRedirectURI(
        clientGrants.allowedRedirectURIS,
        demandedRedirectURI,
      );

      const granter = oAuth2Granters.find(
        (granter) => granter.responseType === responseType,
      );

      if (!granter?.authorize) {
        throw new YError('E_OAUTH2_UNKNOWN_RESPONSE_TYPE', [responseType]);
      }

      checkCodeChallengeParameters(
        responseType,
        codeChallenge,
        OAUTH2.forcePKCE,
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

      const { scopes } = await granter.authorize({
        clientId: givenClientId,
        clientGrants,
        demandedScopes,
      });

      const paramsHash: Record<string, string> = {
        type: responseType,
        redirect_uri: usableRedirectURI,
        scope: stringifyScopes(scopes),
        client_id: givenClientId,
      };

      if (responseType === 'code' && codeChallenge) {
        paramsHash.code_challenge = codeChallenge;
        paramsHash.code_challenge_method =
          codeChallengeMethod || PLAIN_CODE_CHALLENGE_METHOD;
      }

      if (state) {
        paramsHash.state = state;
      }

      addParamsToURL(url, paramsHash, 'query');
    } catch (err) {
      log('debug', '👫 - OAuth2 authorize error.');
      log('error-stack', printStackTrace(err));

      // If errors happen we try to directly redirect
      // to the demanded redirect URI when valid
      try {
        if (usableRedirectURI) {
          url = new URL(usableRedirectURI);
        }
      } catch (err) {
        log('debug', `💥 - Could not redirect to demanded uri.`);
        log('debug-stack', printStackTrace(err));
      }

      const paramsHash = buildParamsFromError(
        err as YError,
        ERRORS_DESCRIPTORS[(err as YError).code] ||
          ERRORS_DESCRIPTORS.E_OAUTH2_UNEXPECTED_ERROR,
      );

      if (finalQuery && finalQuery.state) {
        paramsHash.state = finalQuery.state;
      }

      addParamsToURL(
        url,
        paramsHash,
        finalQuery?.response_type === 'token' ? 'fragment' : 'query',
      );
    }

    return {
      status: 302,
      headers: {
        location: url.href,
      },
    };
  };
}

export default location(autoService(initGetOAuth2Authorize), import.meta.url);
