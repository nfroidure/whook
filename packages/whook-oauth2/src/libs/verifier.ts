import { createHash } from 'crypto';
import { YError } from 'yerror';

export type CodeChallengeMethod = (typeof CODE_CHALLENGE_METHODS)[number];
export const PLAIN_CODE_CHALLENGE_METHOD = 'plain';
export const S256_CODE_CHALLENGE_METHOD = 'S256';

export const CODE_CHALLENGE_METHODS = [
  PLAIN_CODE_CHALLENGE_METHOD,
  S256_CODE_CHALLENGE_METHOD,
] as const;

// See https://tools.ietf.org/html/rfc7636#appendix-A
export function base64UrlEncode(buf: Buffer): string {
  let s = buf.toString('base64');
  s = s.split('=')[0];
  s = s.replaceAll('+', '-');
  s = s.replaceAll('/', '_');
  return s;
}

export function computeCodeChallenge(
  codeChallengeMethod: CodeChallengeMethod,
  codeVerifier: string,
): string {
  if (PLAIN_CODE_CHALLENGE_METHOD === codeChallengeMethod) {
    return codeVerifier;
  }

  if (S256_CODE_CHALLENGE_METHOD === codeChallengeMethod) {
    return base64UrlEncode(
      createHash('sha256').update(Buffer.from(codeVerifier)).digest(),
    );
  }

  throw new YError('E_OAUTH2_UNSUPPORTED_CODE_CHALLENGE_METHOD', [
    codeChallengeMethod,
  ]);
}

export function checkCodeChallenge(
  codeChallengeMethod: CodeChallengeMethod,
  codeChallenge: string,
  codeVerifier: string,
) {
  const computedCodeChallenge = computeCodeChallenge(
    codeChallengeMethod,
    codeVerifier,
  );

  if (computedCodeChallenge !== codeChallenge) {
    throw new YError('E_OAUTH2_BAD_CODE_VERIFIER', [
      codeChallenge,
      computedCodeChallenge,
    ]);
  }
}
