import { autoService, location } from 'knifecycle';
import {
  noop,
  refersTo,
  type WhookAPIParameterDefinition,
  type WhookAPISchemaDefinition,
} from '@whook/whook';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import {
  type WhookOAuth2GranterService,
  type WhookOAuth2ReadClientGrantsService,
  type WhookOAuth2Options,
  type WhookOAuth2GranterDefinitions,
  type WhookOAuth2ClientId,
} from './oAuth2Granters.js';
import {
  type WhookAuthenticationScope,
  type WhookAuthenticationData,
} from '@whook/authorization';
import { checkGrantType } from '../libs/grants.js';
import { filterScopes } from '../libs/scopes.js';
import { checkRedirectURI } from '../libs/redirectURI.js';
import {
  checkCodeChallenge,
  CODE_CHALLENGE_METHODS,
  PLAIN_CODE_CHALLENGE_METHOD,
  type CodeChallengeMethod,
} from '../libs/verifier.js';
import { toUsableClientId } from '../libs/clients.js';

export const AUTHORIZATION_CODE_GRANT_TYPE = 'authorization_code';
export const AUTHORIZATION_CODE_RESPONSE_TYPE = 'code';

export const codeVerifierSchema = {
  name: 'CodeVerifier',
  schema: {
    type: 'string',
    minLength: 43,
    maxLength: 128,
    pattern: '^[A-Za-z0-9._~-]+$',
  },
} as const satisfies WhookAPISchemaDefinition;

export const authorizationCodeTokenRequestBodySchema = {
  name: 'AuthorizationCodeRequestBody',
  schema: {
    description:
      'Implements the [Token Endpoint](https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#section-3.2) as defined per the OAuth2.1 RFC.',
    type: 'object',
    required: ['grant_type', 'code'],
    properties: {
      grant_type: {
        type: 'string',
        const: AUTHORIZATION_CODE_GRANT_TYPE,
      },
      code: {
        type: 'string',
      },
      client_id: {
        type: 'string',
      },
      redirect_uri: {
        type: 'string',
        pattern: '^https?://',
        format: 'uri',
      },
      code_verifier: refersTo(codeVerifierSchema),
    },
  },
} as const satisfies WhookAPISchemaDefinition;

export const codeChallengeSchema = {
  name: 'CodeChallenge',
  schema: {
    type: 'string',
    minLength: 43,
    maxLength: 128,
    pattern: '^[A-Za-z0-9\\-._~]{43,128}$',
  },
} as const satisfies WhookAPISchemaDefinition;
export const codeChallengeParameter = {
  name: 'code_challenge',
  parameter: {
    in: 'query',
    name: 'code_challenge',
    required: false,
    schema: refersTo(codeChallengeSchema),
  },
} as const satisfies WhookAPIParameterDefinition;
export const codeChallengeMethodSchema = {
  name: 'CodeChallengeMethod',
  schema: {
    type: 'string',
    enum: CODE_CHALLENGE_METHODS.concat(),
  },
} as const satisfies WhookAPISchemaDefinition;
export const codeChallengeMethodParameter = {
  name: 'code_challenge_method',
  parameter: {
    in: 'query',
    name: 'code_challenge_method',
    required: false,
    schema: refersTo(codeChallengeMethodSchema),
  },
} as const satisfies WhookAPIParameterDefinition;

/**
 * Utility code for providing your own code type
 */
export type WhookOAuth2AuthorizationCode = string;
/**
 * Context passed to the code creation function to
 * be stored and provided as is in the code check one
 */
export interface WhookOAuth2AuthorizationCodeContext {
  readonly demandedRedirectURI: string;
  readonly demandedScopes: WhookAuthenticationScope[];
  readonly filteredScopes: WhookAuthenticationScope[];
  readonly codeChallenge?: string | undefined;
  readonly codeChallengeMethod?: CodeChallengeMethod | undefined;
}

export interface WhookOAuth2AuthorizationCodeService {
  create: (
    userAuthenticationData: WhookAuthenticationData,
    context: WhookOAuth2AuthorizationCodeContext,
  ) => Promise<WhookOAuth2AuthorizationCode>;
  check: (
    clientAuthenticationData: WhookAuthenticationData,
    code: WhookOAuth2AuthorizationCode,
  ) => Promise<{
    codeAuthenticationData: WhookAuthenticationData;
    context: WhookOAuth2AuthorizationCodeContext;
  }>;
}

export interface WhookOAuth2AuthorizationCodeGranterDependencies {
  OAUTH2: WhookOAuth2Options;
  oAuth2AuthorizationCode: WhookOAuth2AuthorizationCodeService;
  readClientGrants: WhookOAuth2ReadClientGrantsService;
  log?: LogService;
}

export interface WhookOAuth2AuthorizationCodeGranterDefinitions extends WhookOAuth2GranterDefinitions {
  grantType: typeof AUTHORIZATION_CODE_GRANT_TYPE;
  responseType: typeof AUTHORIZATION_CODE_RESPONSE_TYPE;
  authorizeParameters: {
    codeChallenge: string;
    codeChallengeMethod: CodeChallengeMethod;
  };
  acknowledgeParameters: {
    codeChallenge: string;
    codeChallengeMethod: CodeChallengeMethod;
  };
  acknowledgedData: {
    code: WhookOAuth2AuthorizationCode;
    codeChallenge?: string;
    codeChallengeMethod?: CodeChallengeMethod;
  };
  authenticateParameters: {
    code: WhookOAuth2AuthorizationCode;
    redirectURI?: string;
    clientId?: WhookOAuth2ClientId;
    codeVerifier?: string;
  };
}

export type WhookOAuth2AuthorizationCodeGranterService =
  WhookOAuth2GranterService<WhookOAuth2AuthorizationCodeGranterDefinitions>;

// Authorization Code Grant
// https://tools.ietf.org/html/rfc6749#section-4.1
async function initOAuth2AuthorizationCodeGranter({
  OAUTH2,
  oAuth2AuthorizationCode,
  readClientGrants,
  log = noop,
}: WhookOAuth2AuthorizationCodeGranterDependencies): Promise<WhookOAuth2AuthorizationCodeGranterService> {
  const authorizeWithCode: NonNullable<
    WhookOAuth2AuthorizationCodeGranterService['authorize']
  > = async ({ clientId, demandedRedirectURI, demandedScopes }) => {
    const grants = await readClientGrants(clientId);

    if (clientId !== grants.authenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_GRANTS_MISMATCH', [
        clientId,
        grants.authenticationData.clientId,
      ]);
    }

    checkGrantType(grants.allowedGrantTypes, AUTHORIZATION_CODE_GRANT_TYPE);

    const filteredScopes = filterScopes(
      demandedScopes,
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    checkRedirectURI(grants.allowedRedirectURIS, demandedRedirectURI);

    return {
      clientId,
      redirectURI: demandedRedirectURI,
      scopes: filteredScopes,
    };
  };

  // Authorization Code Response:
  // https://tools.ietf.org/html/rfc6749#section-4.1.2
  const acknowledgeWithCode: NonNullable<
    WhookOAuth2AuthorizationCodeGranterService['acknowledge']
  > = async (
    userAuthenticationData,
    { clientId, demandedRedirectURI, demandedScopes },
    { codeChallenge, codeChallengeMethod },
  ) => {
    const grants = await readClientGrants(clientId);

    if (grants.isPublicClient) {
      if (!codeChallenge) {
        throw new YError('E_OAUTH2_AUTHORIZATION_CODE_CHALLENGE_REQUIRED');
      }
    }
    if (!userAuthenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    checkGrantType(grants.allowedGrantTypes, AUTHORIZATION_CODE_GRANT_TYPE);
    checkRedirectURI(grants.allowedRedirectURIS, demandedRedirectURI);

    const filteredScopes = filterScopes(
      demandedScopes,
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    const code = await oAuth2AuthorizationCode.create(
      {
        ...userAuthenticationData,
        clientId,
        scopes: filteredScopes,
      },
      {
        demandedRedirectURI,
        demandedScopes,
        filteredScopes,
        ...(codeChallenge
          ? {
              codeChallenge,
              codeChallengeMethod:
                codeChallengeMethod || PLAIN_CODE_CHALLENGE_METHOD,
            }
          : {}),
      },
    );

    return {
      acknowledgedAuthenticationData: {
        ...userAuthenticationData,
        clientId,
        scopes: filteredScopes,
      },
      acknowledgedScopes: filteredScopes,
      acknowledgedRedirectURI: demandedRedirectURI,
      acknowledgedData: {
        code,
        ...(codeChallenge
          ? {
              codeChallenge,
              codeChallengeMethod,
            }
          : {}),
      },
    };
  };

  const authenticateWithCode: NonNullable<
    WhookOAuth2AuthorizationCodeGranterService['authenticate']
  > = async (
    { code, clientId, redirectURI, codeVerifier },
    optionalAuthenticationData,
  ) => {
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

    if (grants.isPublicClient) {
      if (!codeVerifier) {
        throw new YError('E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_REQUIRED');
      }
    }

    checkGrantType(grants.allowedGrantTypes, AUTHORIZATION_CODE_GRANT_TYPE);

    const { codeAuthenticationData, context } =
      await oAuth2AuthorizationCode.check(
        optionalAuthenticationData || grants.authenticationData,
        code,
      );

    if (redirectURI && redirectURI !== context.demandedRedirectURI) {
      throw new YError('E_OAUTH2_BAD_REDIRECT_URI', [
        redirectURI,
        [context.demandedRedirectURI],
      ]);
    }

    if (usableClientId !== codeAuthenticationData.clientId) {
      throw new YError('E_OAUTH2_CLIENT_MISMATCH', [
        usableClientId,
        codeAuthenticationData.clientId,
      ]);
    }

    if (codeVerifier) {
      if (!context.codeChallenge || !context.codeChallengeMethod) {
        throw new YError(
          'E_OAUTH2_BAD_AUTHORIZATION_CODE_VERIFIER_CONTEXT',
          [],
        );
      }

      checkCodeChallenge(
        context.codeChallengeMethod,
        context.codeChallenge,
        codeVerifier,
      );
    } else if (context.codeChallenge || context.codeChallengeMethod) {
      throw new YError('E_OAUTH2_AUTHORIZATION_CODE_VERIFIER_EXPECTED', [
        context.codeChallenge,
        context.codeChallengeMethod,
      ]);
    }

    const filteredScopes = filterScopes(
      filterScopes(
        context.filteredScopes,
        codeAuthenticationData.scopes,
        !!OAUTH2.strictScopesChecks,
      ),
      grants.allowedScopes,
      !!OAUTH2.strictScopesChecks,
    );

    return {
      ...codeAuthenticationData,
      scopes: filteredScopes,
    };
  };

  log('debug', '👫 - OAuth2AuthorizationCodeGranter Service Initialized!');

  return {
    grantType: AUTHORIZATION_CODE_GRANT_TYPE,
    responseType: AUTHORIZATION_CODE_RESPONSE_TYPE,
    issuesRefreshToken: true,
    authorize: authorizeWithCode,
    acknowledge: acknowledgeWithCode,
    authenticate: authenticateWithCode,
  };
}

export default location(
  autoService(initOAuth2AuthorizationCodeGranter),
  import.meta.url,
);
