import { autoService, location } from 'knifecycle';
import { type LogService } from 'common-services';
import { type JsonValue } from 'type-fest';
import { type WhookHeaders } from '../index.js';

export type WhookSensibleValueDescriptor = {
  name: string;
  pattern: RegExp;
  clearIndices: number[];
};
export type WhookObfuscatorConfig = {
  SHIELD_CHAR?: string;
  MAX_CLEAR_CHARS?: number;
  MAX_CLEAR_RATIO?: number;
  SENSIBLE_PROPS?: WhookSensibleValueDescriptor[];
  SENSIBLE_HEADERS?: WhookSensibleValueDescriptor[];
};
export type WhookObfuscatorDependencies = {
  log?: LogService;
} & WhookObfuscatorConfig;
export type WhookObfuscatorService = {
  obfuscate: (secret: string) => string;
  obfuscateSensibleProps: (
    propValue: JsonValue,
    propName?: string,
  ) => JsonValue;
  obfuscateSensibleHeaders: (headers: WhookHeaders) => WhookHeaders;
};

export default location(autoService(initObfuscator), import.meta.url);

const noop = () => undefined;

const DEFAULT_MAX_CLEAR_CHARS = 6;
const DEFAULT_MAX_CLEAR_RATIO = 4;
const DEFAULT_SHIELD_CHAR = '🛡';
const DEFAULT_SENSIBLE_HEADERS: WhookSensibleValueDescriptor[] = [
  {
    name: 'authorization',
    pattern: /^(Bearer |Basic )(.*)$/i,
    clearIndices: [0],
  },
  { name: 'cookie', pattern: /^(.*)$/i, clearIndices: [] },
  {
    name: 'set-cookie',
    pattern: /^([^=]+=)([^;]*)(.*)$/i,
    clearIndices: [0, 2],
  },
];
const DEFAULT_SENSIBLE_PROPS: WhookSensibleValueDescriptor[] = [
  {
    name: 'access_token',
    pattern: /^(.*)$/i,
    clearIndices: [0],
  },
  {
    name: 'refresh_token',
    pattern: /^(.*)$/i,
    clearIndices: [0],
  },
  {
    name: 'password',
    pattern: /^(.*)$/i,
    clearIndices: [],
  },
  {
    name: 'token',
    pattern: /^(.*)$/i,
    clearIndices: [],
  },
  ...DEFAULT_SENSIBLE_HEADERS,
];

/**
 * Obfuscate sensible informations.
 * @param  {Object}   services
 * The service dependend on
 * @param  {Object}   [services.SHIELD_CHAR]
 * The char for replacing sensible informations
 * @param  {Object}   [services.MAX_CLEAR_CHARS]
 * The maximum clear chars to display
 * @param  {Object}   [services.MAX_CLEAR_RATIO]
 * The maximum clear chars ratio to display
 * @param  {Object}   [services.SENSIBLE_PROPS]
 * Sensible properties names
 * @param  {Object}   [services.SENSIBLE_HEADERS]
 * Sensible headers names
 * @return {Promise<Object>}
 * A promise of an object containing the gathered constants.
 * @example
 * import { initObfuscator } from '@whook/whook';
 * import { alsoInject } from 'knifecycle';
 * import { log } from 'node:console';
 *
 * const obfuscator = await initObfuscator();
 *
 * log(obfuscator('my very secret information!));
 * // my ...on!
 */
async function initObfuscator({
  SHIELD_CHAR = DEFAULT_SHIELD_CHAR,
  MAX_CLEAR_CHARS = DEFAULT_MAX_CLEAR_CHARS,
  MAX_CLEAR_RATIO = DEFAULT_MAX_CLEAR_RATIO,
  SENSIBLE_PROPS = DEFAULT_SENSIBLE_PROPS,
  SENSIBLE_HEADERS = DEFAULT_SENSIBLE_HEADERS,
  log = noop,
}: WhookObfuscatorDependencies): Promise<WhookObfuscatorService> {
  log('debug', '🕶️ - Initializing the obfuscator service.');

  return {
    obfuscate,
    obfuscateSensibleProps,
    obfuscateSensibleHeaders,
  };

  function obfuscate(secret) {
    const numClearChars = Math.min(
      MAX_CLEAR_CHARS,
      Math.floor(secret.length / MAX_CLEAR_RATIO),
    );

    if (numClearChars <= 1) {
      return SHIELD_CHAR;
    }

    return (
      secret.slice(0, Math.ceil(numClearChars / 2)) +
      '...' +
      secret.slice(secret.length - Math.floor(numClearChars / 2))
    );
  }

  function selectivelyObfuscateAll(
    pattern: RegExp,
    clearIndices: number[],
    values: string | string[],
  ) {
    return values instanceof Array
      ? values.map((value) =>
          selectivelyObfuscate(pattern, clearIndices, value),
        )
      : selectivelyObfuscate(pattern, clearIndices, values);
  }

  function selectivelyObfuscate(
    pattern: RegExp,
    clearIndices: number[],
    value: string,
  ) {
    // SECURITY: Here, we first test the pattern to ensure
    // the selective obfuscation will work, if not, we obfuscate
    // the whole value to default to security
    return 'string' !== typeof value
      ? obfuscate('')
      : pattern.test(value)
        ? value.replace(pattern, (...args) => {
            return args
              .slice(1, -2)
              .map((value, index) =>
                clearIndices.includes(index) ? value : obfuscate(value),
              )
              .join('');
          })
        : obfuscate(value);
  }

  function obfuscateSensibleHeaders(headers: WhookHeaders): WhookHeaders {
    return Object.keys(headers).reduce((finalHeaders, headerName) => {
      const sensibleHeader = SENSIBLE_HEADERS.find(
        (sensibleHeader) =>
          sensibleHeader.name.toLowerCase() === headerName.toLowerCase(),
      );
      return {
        ...finalHeaders,
        [headerName]: sensibleHeader
          ? selectivelyObfuscateAll(
              sensibleHeader.pattern,
              sensibleHeader.clearIndices,
              headers[headerName],
            )
          : headers[headerName],
      };
    }, {});
  }

  function obfuscateSensibleProps(
    propValue: JsonValue,
    propName = '_',
  ): JsonValue {
    if (propValue instanceof Array) {
      return propValue.map((value) => obfuscateSensibleProps(value, propName));
    } else if (typeof propValue === 'object' && propValue !== null) {
      return Object.keys(propValue).reduce(
        (newObject, key) => ({
          ...newObject,
          [key]: obfuscateSensibleProps(propValue[key] as JsonValue, key),
        }),
        {},
      );
    } else if (
      typeof propValue === 'boolean' ||
      typeof propValue === 'string' ||
      typeof propValue === 'number'
    ) {
      const sensibleProp = SENSIBLE_PROPS.find(
        (sensibleProp) =>
          sensibleProp.name.toLowerCase() === propName.toLowerCase(),
      );

      return sensibleProp
        ? selectivelyObfuscate(
            sensibleProp.pattern,
            sensibleProp.clearIndices,
            propValue.toString(),
          )
        : propValue;
    } else if (null === propValue) {
      return null;
    }
    return null;
  }
}
