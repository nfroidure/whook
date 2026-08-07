import camelCase from 'camelcase';

// The OAuth2 standard uses snake case names so we are
// converting them to the project standards asap
export function camelCaseObjectProperties<T>(
  object: Record<string, T>,
): Record<string, T> {
  return Object.keys(object).reduce(
    (camelCasedObject, key) => {
      const newKey = key === 'redirect_uri' ? 'redirectURI' : camelCase(key);

      camelCasedObject[newKey] = object[key];
      return camelCasedObject;
    },
    {} as Record<string, T>,
  );
}

export function snakeCase(s: string): string {
  return s
    .split(/(?=(?<![A-Z])[A-Z])|[^a-zA-Z]+/)
    .map((s) => s.toLowerCase())
    .join('_');
}
