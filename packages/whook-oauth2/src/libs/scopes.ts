import { type WhookAuthenticationScope } from '@whook/authorization';
import { identity } from '@whook/whook';
import { type OpenAPI, PATH_ITEM_METHODS } from 'ya-open-api-types';
import { YError } from 'yerror';

const OAUTH2_SCOPES_SEPARATOR = ' ';

/**
 * Splits a scope into its scope tokens
 */
export function parseOAuth2Scope(oAuth2Scope: string): string[] {
  const scopes = [
    ...new Set(oAuth2Scope.split(OAUTH2_SCOPES_SEPARATOR).filter(identity)),
  ];

  return scopes;
}

/**
 * Join scopes into scope tokens
 */
export function stringifyScopes(scopes: WhookAuthenticationScope[]): string {
  return scopes.join(OAUTH2_SCOPES_SEPARATOR);
}

/**
 * Filter scopes tokens to become valid ones
 */
export function filterScopes(
  scopes: string[],
  allowedScopes: WhookAuthenticationScope[],
  strict: boolean,
): WhookAuthenticationScope[] {
  const filteredScopes: WhookAuthenticationScope[] = [];

  for (const scope of scopes) {
    if (allowedScopes.includes(scope)) {
      filteredScopes.push(scope);
      continue;
    }
    if (strict) {
      throw new YError('E_OAUTH2_BAD_SCOPE', [scope]);
    }
  }

  return filteredScopes;
}

/**
 * Collects all scopes tokens from an Open API
 */
export function collectScopesFromAPI(API: OpenAPI) {
  const scopes: string[] = [];

  if (API?.security) {
    for (const requirement of API.security) {
      Object.keys(requirement).forEach((key) => {
        scopes.push(...requirement[key]);
      });
    }
  }

  if (API.paths) {
    for (const pathObject of Object.values(API.paths)) {
      for (const method of PATH_ITEM_METHODS) {
        const operation = pathObject[method];

        if (operation?.security) {
          for (const requirement of operation.security) {
            Object.keys(requirement).forEach((key) => {
              scopes.push(...requirement[key]);
            });
          }
        }
      }
    }
  }

  return [...new Set(scopes)];
}
