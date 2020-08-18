import { autoService, location } from 'knifecycle';
import { noop } from '@whook/whook';
import { YError } from 'yerror';
import { type LogService } from 'common-services';
import {
  type OAuth2GranterService,
  type CheckApplicationService,
} from './oAuth2Granters.js';
import { createHash } from 'crypto';
import { type WhookAuthenticationData } from '@whook/authorization';

export const CODE_GRANTER_TYPE = 'code';
export const PLAIN_CODE_CHALLENGE_METHOD = 'plain';
export const S256_CODE_CHALLENGE_METHOD = 'S256';
export const CODE_CHALLENGE_METHODS = [
  PLAIN_CODE_CHALLENGE_METHOD,
  S256_CODE_CHALLENGE_METHOD,
] as const;

export type CodeChallengeMethod = (typeof CODE_CHALLENGE_METHODS)[number];

export interface OAuth2CodeService<
  P extends object = Record<string, unknown>,
  C extends string = string,
> {
  create: (
    authenticationData: WhookAuthenticationData,
    redirectURI: string,
    codeChallenge: string | undefined,
    codeChallengeMethod: CodeChallengeMethod | undefined,
    additionalParameters: P,
  ) => Promise<C>;
  check: (
    authenticationData: WhookAuthenticationData,
    code: C,
    redirectURI: string,
    codeVerifier: string | undefined,
  ) => Promise<
    WhookAuthenticationData & {
      redirectURI: string;
    } & P
  >;
}

export interface OAuth2CodeGranterDependencies {
  oAuth2Code: OAuth2CodeService;
  checkApplication: CheckApplicationService;
  log?: LogService;
}
export interface OAuth2CodeGranterAuthorizeParameters {
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
}
export interface OAuth2CodeGranterAcknowledgedData {
  code: string;
}
export interface OAuth2CodeGranterAcknowledgeParameters {
  codeChallenge: string;
  codeChallengeMethod: CodeChallengeMethod;
}
export interface OAuth2CodeGranterGrantParameters {
  code: string;
  redirectURI: string;
  clientId: string;
  codeVerifier: string;
}
export type OAuth2CodeGranterService = OAuth2GranterService<
  OAuth2CodeGranterAuthorizeParameters,
  OAuth2CodeGranterAcknowledgedData,
  OAuth2CodeGranterAcknowledgeParameters,
  OAuth2CodeGranterGrantParameters
>;

export default location(autoService(initOAuth2CodeGranter), import.meta.url);

// Authorization Code Grant
// https://tools.ietf.org/html/rfc6749#section-4.1
async function initOAuth2CodeGranter({
  oAuth2Code,
  checkApplication,
  log = noop,
}: OAuth2CodeGranterDependencies): Promise<OAuth2CodeGranterService> {
  const authorizeWithCode: NonNullable<
    OAuth2CodeGranterService['authorizer']
  >['authorize'] = async ({ clientId, redirectURI, scope = '' }) => {
    const { redirectURI: finalRedirectURI } = await checkApplication({
      applicationId: clientId,
      type: CODE_GRANTER_TYPE,
      redirectURI,
      scope,
    });

    return {
      applicationId: clientId,
      redirectURI: finalRedirectURI,
      scope,
    };
  };

  // Authorization Code Response:
  // https://tools.ietf.org/html/rfc6749#section-4.1.2
  const acknowledgeWithCode: NonNullable<
    OAuth2CodeGranterService['acknowledger']
  >['acknowledge'] = async (
    authenticationData,
    { clientId, redirectURI, scope },
    {
      codeChallenge,
      codeChallengeMethod,
      ...additionalParameters
    },
  ) => {
    const code = await oAuth2Code.create(
      { ...authenticationData, applicationId: clientId, scope },
      redirectURI,
      codeChallenge,
      codeChallengeMethod,
      additionalParameters,
    );

    return {
      authenticationData: {
        ...authenticationData,
        applicationId: clientId,
        scope,
      },
      redirectURI,
      acknowledgedData: {
        code,
      },
      additionalParameters,
    };
  };

  const authenticateWithCode: NonNullable<
    OAuth2CodeGranterService['authenticator']
  >['authenticate'] = async (
    { code, clientId, redirectURI, codeVerifier },
    authenticationData,
  ) => {
    // The client must be authenticated (for now, see below)
    if (!authenticationData) {
      throw new YError('E_UNAUTHORIZED');
    }

    // This check is not really necessary atm but it acts
    // as a reminder that this grant type could be used
    // without authenticating the client. In this
    // scenario, the authenticationData should be deducted
    // from the clientId and the code given in parameters
    // See https://tools.ietf.org/html/rfc6749#section-4.1.3
    if (clientId && clientId !== authenticationData.applicationId) {
      throw new YError('E_APPLICATION_ID_MISMATCH', [
        clientId,
        authenticationData.applicationId,
      ]);
    }

    await checkApplication({
      applicationId: authenticationData.applicationId,
      type: CODE_GRANTER_TYPE,
      scope: '',
    });

    const newAuthenticationData = await oAuth2Code.check(
      authenticationData,
      code,
      redirectURI,
      codeVerifier,
    );

    return newAuthenticationData;
  };

  log('debug', '👫 - OAuth2CodeGranter Service Initialized!');

  return {
    type: CODE_GRANTER_TYPE,
    authorizer: {
      responseType: 'code',
      authorize: authorizeWithCode,
    },
    acknowledger: {
      acknowledgmentType: 'code',
      acknowledge: acknowledgeWithCode,
    },
    authenticator: {
      grantType: 'authorization_code',
      authenticate: authenticateWithCode,
    },
  };
}

// See https://tools.ietf.org/html/rfc7636#appendix-A
export function base64UrlEncode(buf: Buffer): string {
  let s = buf.toString('base64');
  s = s.split('=')[0];
  s = s.replaceAll('+', '-');
  s = s.replaceAll('/', '_');
  return s;
}

export function hashCodeVerifier(
  codeVerifier: Buffer,
  method: CodeChallengeMethod,
): Buffer {
  if (PLAIN_CODE_CHALLENGE_METHOD === method) {
    return codeVerifier;
  }
  if (S256_CODE_CHALLENGE_METHOD === method) {
    return createHash('sha256').update(codeVerifier).digest();
  }
  throw new YError('E_UNSUPPORTED_CODE_CHALLENGE_METHOD', [method]);
}
