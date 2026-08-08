import { refersTo, type WhookAPISchemaDefinition } from '@whook/whook';

export const scopeTokenSchema = {
  name: 'ScopeToken',
  schema: {
    description:
      'OAuth 2.1 scope token, see https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#name-access-token-scope',
    type: 'string',
    pattern: '^[!#-[\\]-~]+$',
  },
} as const satisfies WhookAPISchemaDefinition;
export const scopeTokensSchema = {
  name: 'ScopeTokens',
  schema: {
    type: 'array',
    items: refersTo(scopeTokenSchema),
  },
} as const satisfies WhookAPISchemaDefinition;
export const scopeSchema = {
  name: 'Scope',
  schema: {
    description:
      'OAuth 2.1 scope, see https://www.ietf.org/archive/id/draft-ietf-oauth-v2-1-15.html#name-access-token-scope',
    type: 'string',
    pattern: '^[!#-[\\]-~]+(?: [!#-[\\]-~]+)*$',
  },
} as const satisfies WhookAPISchemaDefinition;

export const requestURISchema = {
  name: 'RequestURI',
  schema: {
    description:
      'OAuth2 PAR request_uri, see https://datatracker.ietf.org/doc/html/rfc9126#section-2.2.',
    type: 'string',
    pattern: '^urn:ietf:params:oauth:request_uri:',
  },
} as const satisfies WhookAPISchemaDefinition;
