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
    required: false,
    schema: {
      type: 'string',
    },
  },
} as const satisfies WhookAPIParameterDefinition;
export const requestParameter = {
  name: 'request',
  parameter: {
    in: 'query',
    name: 'request',
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
    schema: {
      type: 'string',
      format: 'uri',
      pattern: '^https?://',
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
      refersTo(requestParameter),
      refersTo(requestURIParameter),
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
    query,
  }: {
    query: Record<string, string | undefined> & {
      response_type?: string;
      client_id?: string;
      request?: string;
      request_uri?: string;
      redirect_uri?: string;
      scope?: string;
      state?: string;
      code_challenge?: string;
      code_challenge_method?: CodeChallengeMethod;
    };
  }) => {
    let responseType = query.response_type;
    let givenClientId: string;
    let demandedRedirectURI = query.redirect_uri || '';
    let demandedScope: string;
    let state = query.state;
    let codeChallenge: string | undefined;
    let codeChallengeMethod: CodeChallengeMethod | undefined;
    let authorizeParameters: Record<string, string>;

    // If everything goes well we proxy the request
    // to the authentication server for acknowledgment
    let url = new URL(OAUTH2.authenticateURL);

    try {
      ({
        responseType,
        givenClientId,
        demandedRedirectURI,
        demandedScope,
        state,
        codeChallenge,
        codeChallengeMethod,
        authorizeParameters,
      } = parseAuthorizeRequest(query));

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

const KNOWN_AUTHORIZATION_PARAMETERS = new Set([
  'response_type',
  'client_id',
  'request',
  'request_uri',
  'redirect_uri',
  'scope',
  'state',
  'code_challenge',
  'code_challenge_method',
]);

function parseAuthorizeRequest(
  query: Record<string, string | undefined>,
): {
  responseType: string;
  givenClientId: string;
  demandedRedirectURI: string;
  demandedScope: string;
  state: string;
  codeChallenge: string | undefined;
  codeChallengeMethod: CodeChallengeMethod | undefined;
  authorizeParameters: Record<string, string>;
} {
  if (query.request_uri) {
    throw new YError('E_OAUTH2_UNSUPPORTED_REQUEST_URI');
  }

  const mergedParameters = {
    ...query,
  } as Record<string, string | undefined>;

  if (query.request) {
    const requestParameters = parseRequestObject(query.request);

    Object.keys(requestParameters).forEach((name) => {
      const value = requestParameters[name];

      if (
        typeof mergedParameters[name] !== 'undefined' &&
        mergedParameters[name] !== value
      ) {
        throw new YError('E_OAUTH2_REQUEST_PARAMETERS_MISMATCH', [name]);
      }

      mergedParameters[name] = value;
    });
  }

  const responseType = mergedParameters.response_type;
  const givenClientId = mergedParameters.client_id;
  const state = mergedParameters.state;

  if (!responseType) {
    throw new YError('E_OAUTH2_REQUEST_PARAMETER_REQUIRED', ['response_type']);
  }

  if (!givenClientId) {
    throw new YError('E_OAUTH2_REQUEST_PARAMETER_REQUIRED', ['client_id']);
  }

  if (!state) {
    throw new YError('E_OAUTH2_REQUEST_PARAMETER_REQUIRED', ['state']);
  }

  const authorizeParameters = Object.keys(mergedParameters).reduce(
    (newAuthorizeParameters, name) => {
      const value = mergedParameters[name];

      if (!KNOWN_AUTHORIZATION_PARAMETERS.has(name) && value) {
        newAuthorizeParameters[name] = value;
      }

      return newAuthorizeParameters;
    },
    {} as Record<string, string>,
  );

  return {
    responseType,
    givenClientId,
    demandedRedirectURI: mergedParameters.redirect_uri || '',
    demandedScope: mergedParameters.scope || '',
    state,
    codeChallenge: mergedParameters.code_challenge,
    codeChallengeMethod:
      mergedParameters.code_challenge_method as CodeChallengeMethod,
    authorizeParameters,
  };
}

function parseRequestObject(request: string): Record<string, string> {
  const requestParts = request.split('.');

  if (requestParts.length !== 3 || !requestParts[1]) {
    throw new YError('E_OAUTH2_BAD_REQUEST_OBJECT');
  }

  let requestBody: unknown;

  try {
    requestBody = JSON.parse(
      Buffer.from(requestParts[1], 'base64url').toString('utf-8'),
    );
  } catch (err) {
    throw YError.wrap(err as YError, 'E_OAUTH2_BAD_REQUEST_OBJECT');
  }

  if (!requestBody || typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    throw new YError('E_OAUTH2_BAD_REQUEST_OBJECT');
  }

  const requestBodyHash = requestBody as Record<string, unknown>;

  return Object.keys(requestBodyHash).reduce(
    (parameters, name) => {
      const value = requestBodyHash[name];

      if (typeof value !== 'string') {
        throw new YError('E_OAUTH2_BAD_REQUEST_OBJECT');
      }

      parameters[name] = value;
      return parameters;
    },
    {} as Record<string, string>,
  );
}
