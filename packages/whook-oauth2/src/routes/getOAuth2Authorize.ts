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
} from '../services/oAuth2Granters.js';
import { type LogService } from 'common-services';
import {
  filterScopes,
  parseOAuth2Scope,
  stringifyScopes,
} from '../libs/scopes.js';
import {
  type CodeChallengeMethod,
  PLAIN_CODE_CHALLENGE_METHOD,
} from '../libs/verifier.js';
import { scopeSchema } from '../libs/schemas.js';
import {
  AUTHORIZATION_CODE_RESPONSE_TYPE,
  codeChallengeMethodSchema,
  codeChallengeMethodParameter,
  codeChallengeSchema,
  codeChallengeParameter,
} from '../services/oAuth2AuthorizationCodeGranter.js';
import { IMPLICIT_RESPONSE_TYPE } from '../services/oAuth2ImplicitGranter.js';
import { camelCaseObjectProperties } from '../libs/utils.js';
import { addParamsToURL, buildParamsFromError } from '../libs/redirectURI.js';

export {
  scopeSchema,
  codeChallengeMethodSchema,
  codeChallengeMethodParameter,
  codeChallengeSchema,
  codeChallengeParameter,
};

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
    required: true,
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
    required: true,
    schema: {
      type: 'string',
    },
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
  ERRORS_DESCRIPTORS,
  oAuth2Granters,
  log,
}: {
  OAUTH2: WhookOAuth2Options;
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
  oAuth2Granters: WhookOAuth2GranterService<WhookOAuth2GranterDefinitions>[];
  log: LogService;
}) {
  return async ({
    query: {
      response_type: responseType,
      client_id: givenClientId,
      redirect_uri: demandedRedirectURI = '',
      scope: demandedScope = '',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      ...authorizeParameters
    },
  }: {
    query: {
      response_type: string;
      client_id: string;
      redirect_uri?: string;
      scope?: string;
      state: string;
      code_challenge?: string;
      code_challenge_method?: CodeChallengeMethod;
    } & Record<string, string>;
  }) => {
    // If everything goes well we proxy the request
    // to the authentication server for acknowledgment
    let url = new URL(OAUTH2.authenticateURL);

    try {
      const granter = oAuth2Granters.find(
        (granter) => granter.responseType === responseType,
      );

      if (!granter?.authorize) {
        throw new YError('E_OAUTH2_UNKNOWN_RESPONSE_TYPE', [responseType]);
      }

      if (responseType === 'code') {
        if (!codeChallenge) {
          if (OAUTH2.forcePKCE) {
            throw new YError('E_OAUTH2_PKCE_REQUIRED', [responseType]);
          }
        }
      } else if (codeChallenge) {
        throw new YError('E_OAUTH2_PKCE_NOT_SUPPORTED', [responseType]);
      }

      const demandedScopes = filterScopes(
        parseOAuth2Scope(demandedScope),
        OAUTH2.allowedScopes,
        !!OAUTH2.strictScopesChecks,
      );

      const { clientId, redirectURI, scopes } = await granter.authorize(
        {
          clientId: givenClientId,
          demandedRedirectURI,
          demandedScopes,
        },
        camelCaseObjectProperties(authorizeParameters),
      );

      const paramsHash: Record<string, string> = {
        type: responseType,
        redirect_uri: redirectURI,
        scope: stringifyScopes(scopes),
        client_id: clientId,
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
      // to the demanded redirect URI
      try {
        url = new URL(demandedRedirectURI);
      } catch (err) {
        log('debug', `💥 - Could not redirect to demanded uri.`);
        log('debug-stack', printStackTrace(err));
        url = new URL(OAUTH2.authenticateURL);
      }

      const paramsHash = buildParamsFromError(
        err as YError,
        ERRORS_DESCRIPTORS[(err as YError).code] ||
          ERRORS_DESCRIPTORS.E_OAUTH2_UNEXPECTED_ERROR,
      );

      if (state) {
        paramsHash.state = state;
      }

      addParamsToURL(
        url,
        paramsHash,
        responseType === 'token' ? 'fragment' : 'query',
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
