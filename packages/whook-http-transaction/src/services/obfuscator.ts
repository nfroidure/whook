import { autoService } from 'knifecycle';
import { LogService } from 'common-services';

export type SensibleValueDescriptor = {
  name: string;
  pattern: RegExp;
  clearIndices: number[];
};
export type ObfuscatorConfig = {
  SHIELD_CHAR?: string;
  MAX_CLEAR_CHARS?: number;
  MAX_CLEAR_RATIO?: number;
  SENSIBLE_PROPS?: SensibleValueDescriptor[];
  SENSIBLE_HEADERS?: SensibleValueDescriptor[];
};
export type ObfuscatorDependencies = {
  log?: LogService;
} & ObfuscatorConfig;
export type ObfuscatorService = {
  obfuscate: (secret: string) => string;
  obfuscateSensibleProps: (propValue: any, propName?: string) => any;
  obfuscateSensibleHeaders: (headers: {
    [name: string]: string;
  }) => { [name: string]: string };
};

export default autoService(initObfuscator);

const noop = () => {};

const DEFAULT_MAX_CLEAR_CHARS = 6;
const DEFAULT_MAX_CLEAR_RATIO = 4;
const DEFAULT_SHIELD_CHAR = '🛡';
const DEFAULT_SENSIBLE_HEADERS: SensibleValueDescriptor[] = [
  {
    name: 'authorization',
    pattern: /^(Bearer |Basic )(.*)$/i,
    clearIndices: [0],
  },
  { name: 'cookie', pattern: /^(.*)$/i, clearIndices: [] },
];
const DEFAULT_SENSIBLE_PROPS: SensibleValueDescriptor[] = [
  {
    name: 'access_token',
    pattern: /^(Bearer |Basic )(.*)$/i,
    clearIndices: [0],
  },
  {
    name: 'refresh_token',
    pattern: /^(Bearer |Basic )(.*)$/i,
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
 * Allow to proxy constants directly by serializing it in the
 *  build, saving some computing and increasing boot time of
 *  lambdas.
 * @param  {Object}   constants
 * The serializable constants to gather
 * @return {Promise<Object>}
 * A promise of an object containing the gathered constants.
 * @example
 * import { initBuildConstants } from '@whook/aws-lambda';
 * import { alsoInject } from 'knifecycle';
 *
 * export default alsoInject(['MY_OWN_CONSTANT'], initBuildConstants);
 */
async function initObfuscator({
  SHIELD_CHAR = DEFAULT_SHIELD_CHAR,
  MAX_CLEAR_CHARS = DEFAULT_MAX_CLEAR_CHARS,
  MAX_CLEAR_RATIO = DEFAULT_MAX_CLEAR_RATIO,
  SENSIBLE_PROPS = DEFAULT_SENSIBLE_PROPS,
  SENSIBLE_HEADERS = DEFAULT_SENSIBLE_HEADERS,
  log = noop,
}: ObfuscatorDependencies): Promise<ObfuscatorService> {
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

  function selectivelyObfuscate(pattern, clearIndices, value) {
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

  function obfuscateSensibleHeaders(headers: { [name: string]: string }) {
    return Object.keys(headers).reduce((finalHeaders, headerName) => {
      const sensibleHeader = SENSIBLE_HEADERS.find(
        sensibleHeader =>
          sensibleHeader.name.toLowerCase() === headerName.toLowerCase(),
      );
      return {
        ...finalHeaders,
        [headerName]: sensibleHeader
          ? selectivelyObfuscate(
              sensibleHeader.pattern,
              sensibleHeader.clearIndices,
              headers[headerName],
            )
          : headers[headerName],
      };
    }, {});
  }

  function obfuscateSensibleProps(propValue, propName = '_') {
    if (propValue instanceof Array) {
      return propValue.map(value => obfuscateSensibleProps(value, propName));
    } else if (typeof propValue === 'object' && propValue !== null) {
      return Object.keys(propValue).reduce(
        (newObject, key) => ({
          ...newObject,
          [key]: obfuscateSensibleProps(propValue[key], key),
        }),
        {},
      );
    } else if (
      typeof propValue === 'boolean' ||
      typeof propValue === 'string' ||
      typeof propValue === 'number'
    ) {
      const sensibleProp = SENSIBLE_PROPS.find(
        sensibleProp =>
          sensibleProp.name.toLowerCase() === propName.toLowerCase(),
      );

      return sensibleProp
        ? selectivelyObfuscate(
            sensibleProp.pattern,
            sensibleProp.clearIndices,
            propValue,
          )
        : propValue;
    } else if (null === propValue) {
      return null;
    }
    return undefined;
  }
}
