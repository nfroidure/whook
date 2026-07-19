import { type OpenAPI, PATH_ITEM_METHODS } from 'ya-open-api-types';

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
