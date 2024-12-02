import { initializer } from 'knifecycle';
import {
  DEFAULT_DEBUG_NODE_ENVS,
  DEFAULT_STRINGIFYERS,
} from '../libs/constants.js';
import miniquery from 'miniquery';
import { printStackTrace, YError } from 'yerror';
import type { WhookStringifyers } from '../index.js';
import type { WhookResponseSpec } from '../libs/utils.js';
import type { WhookResponse } from '@whook/http-transaction';
import type { YHTTPError } from 'yhttperror';
import type { OpenAPIV3_1 } from 'openapi-types';
import type { AppEnvVars } from 'application-services';

/* Architecture Note #2: Error handler

Whook provides a default error handler that allows
 you to use the [`yerror`](https://github.com/nfroidure/yerror)
 and [`yhttperror`](https://github.com/nfroidure/yhttperror)
 modules to throw errors with some parameters allowing you
 to give some debugging context with raised errors.

Depending on the `NODE_ENV` it adds extra informations to
 HTTP response, beware to avoid activating it in production.
*/

/* Architecture Note #2.1: Errors descriptors

Errors descriptors allows you to change the error
 handler behavior selectively for each error :
- change error codes to proper error messages templated
 with params,
- add URIs to help for debugging API errors
- override the error status with the `status` property.
- decide to pass some error parameters through with the
 `transmittedParams` so that your end users can have some
 more context on the error root cause.
*/
export type WhookErrorDescriptor = {
  code: string;
  description?: string;
  uri?: string;
  help?: string;
  status?: number;
  transmittedParams?: number[];
};
export type WhookErrorsDescriptors = {
  [errorCode: string]: WhookErrorDescriptor;
};

export const DEFAULT_ERROR_URI =
  'https://stackoverflow.com/search?q=%5Bwhook%5D+$code';
export const DEFAULT_HELP_URI =
  'https://stackoverflow.com/questions/ask?tags=whook&title=How+to+debug+$code+whook+error+code';
export const DEFAULT_DEFAULT_ERROR_CODE = 'E_UNEXPECTED';
export const DEFAULT_ERRORS_DESCRIPTORS = {
  [DEFAULT_DEFAULT_ERROR_CODE]: {
    code: 'error',
    description: 'Got an unexpected error',
    status: 500,
    help: DEFAULT_HELP_URI,
  },
  E_TRANSACTION_TIMEOUT: {
    code: 'error',
    description: 'The request processing timed out (timeout: "$0")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_STRINGIFYER_LACK: {
    code: 'router_misconfiguration',
    description:
      'The router has no stringifyer declared for the response content type "$0" with status "$1.status"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNDECLARED_PATH_PARAMETER: {
    code: 'router_misconfiguration',
    description:
      'The no path parameter declared for the node "$0" on the path "$1"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_PATH: {
    code: 'router_misconfiguration',
    description: 'The path "$0" must start with a slash',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NO_OPERATION_ID: {
    code: 'router_misconfiguration',
    description: 'No operation id for the path "$0" and the "$1"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NO_HANDLER: {
    code: 'router_misconfiguration',
    description: 'No handler declared for the operation id "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_OPEN_API: {
    code: 'router_misconfiguration',
    description: 'The Open API provided to the router seems invalid',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNDECLARED_SECURITY_SCHEME: {
    code: 'router_misconfiguration',
    description:
      'An operation ("$1") mentions an undeclared security scheme ("$0")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_BODY_SCHEMA: {
    code: 'router_misconfiguration',
    description: 'An operation ("$0") has an invalid body schema ("$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNSUPPORTED_HTTP_SCHEME: {
    code: 'router_misconfiguration',
    description: 'This router do not support this security schema yet ("$0")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNSUPPORTED_API_KEY_SOURCE: {
    code: 'router_misconfiguration',
    description: 'This router do not support this API key source yet ("$0")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_PARAMETER_NAME: {
    code: 'router_misconfiguration',
    description:
      'Bad name for the parameter at index "$1" for the operation "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNSUPPORTED_PARAMETER_DEFINITION: {
    code: 'router_misconfiguration',
    description:
      'This router does not support the parameter "$1" defined in "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_PARAMETER_SCHEMA: {
    code: 'router_misconfiguration',
    description:
      'The router  where unable to compile the parameter "$1" defined in "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NO_RESPONSE_PROMISE: {
    code: 'bad_handler',
    description:
      'The handler for the operation id "$0" seems to not return a promise',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NO_RESPONSE: {
    code: 'bad_handler',
    description:
      'The handler for the operation id "$0" seems to not return any response',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NO_RESPONSE_STATUS: {
    code: 'bad_handler',
    description:
      'The handler for the operation id "$0" seems to not return any status',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NON_NUMERIC_STATUS: {
    code: 'bad_handler',
    description:
      'The handler for the operation id "$0" seems to not be a number',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_NOT_FOUND: {
    code: 'bad_handler',
    description: 'No endpoint found at that path ("$0", "$2")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_REQUEST_CONTENT_TOO_LARGE: {
    code: 'bad_request',
    description:
      'The request content length ("$0") exceeded the maximun allowed ("$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_BODY: {
    code: 'bad_request',
    description: 'The request body could not be parsed',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
    transmittedParams: [0],
  },
  E_BAD_BODY_LENGTH: {
    code: 'bad_request',
    description:
      'The request body length ("$0") is different than the length defined in the headers ("$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNSUPPORTED_CHARSET: {
    code: 'bad_request',
    description:
      'The body charset "$0" is not supported (supported charsets "$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_CONTENT_TYPE: {
    code: 'bad_request',
    description: 'The content type provided is wierd "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_REQUEST_FAILURE: {
    code: 'bad_request',
    description: 'Failed to read the request body input stream',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNSUPPORTED_MEDIA_TYPE: {
    code: 'bad_request',
    description:
      'The body media type "$0" is not supported (supported media types "$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNACCEPTABLE_CHARSET: {
    code: 'bad_request',
    description:
      'The asked response charset "$0" is not satifyable (allowed charsets "$2")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNACCEPTABLE_MEDIA_TYPE: {
    code: 'bad_request',
    description:
      'The asked response media type "$0" is not satifyable (allowed media types "$1")',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_REQUIRED_REQUEST_BODY: {
    code: 'bad_request',
    description: 'This endpoint requires a request body to be sent',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_REQUEST_BODY: {
    code: 'bad_request',
    description: 'The request body does not match the schema',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
    transmittedParams: [2, 3],
  },
  E_NO_REQUEST_BODY: {
    code: 'bad_request',
    description:
      'This endpoint do not declare a request body but one were sent',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_REQUIRED_PARAMETER: {
    code: 'bad_request',
    description: 'This endpoint requires a value for the parameter "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_BAD_PARAMETER: {
    code: 'bad_request',
    description: 'The value provided for the parameter "$0" is not valid',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
    transmittedParams: [2, 3],
  },
  E_NON_REENTRANT_NUMBER: {
    code: 'bad_request',
    description: 'The value provided for the parameter "$0" is not reentrant',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
    transmittedParams: [2, 3],
  },
  E_BAD_BOOLEAN: {
    code: 'bad_request',
    description: 'The value provided ("$0") is not a boolean',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_TRANSACTION_ID_NOT_UNIQUE: {
    code: 'bad_request',
    description:
      'The transaction id of the request "$0" is colliding with another one.',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};

export type WhookErrorHandlerConfig = {
  DEBUG_NODE_ENVS: string[];
  ERRORS_DESCRIPTORS: WhookErrorsDescriptors;
  DEFAULT_ERROR_CODE?: string;
};
export type WhookErrorHandlerDependencies = WhookErrorHandlerConfig & {
  ENV: AppEnvVars;
  STRINGIFYERS?: WhookStringifyers;
};

export interface WhookErrorHandler {
  (
    transactionId: string,
    responseSpec: WhookResponseSpec,
    err: Error,
  ): Promise<WhookErrorResponse>;
}

export type WhookErrorResponse = WhookResponse<
  number,
  {
    'cache-control': 'private';
    'content-type': string;
    [name: string]: string;
  },
  {
    error: string;
    error_description?: string;
    error_uri?: string;
    error_help_uri?: string;
    error_params?: unknown[];
    error_debug_data: {
      guruMeditation: string;
      code?: string;
      stack?: string;
      params?: unknown[];
    };
  }
>;

export const WhookErrorSchema: OpenAPIV3_1.SchemaObject = {
  type: 'object',
  additionalProperties: false,
  properties: {
    error: { type: 'string' },
    error_description: { type: 'string' },
    error_uri: { type: 'string' },
    error_debug_data: {
      type: 'object',
      additionalProperties: true,
      properties: {
        code: { type: 'string' },
        stack: { type: 'string' },
        // TODO: find a way to specify params or
        // maybe standardize it (only one object in params?)
      },
    },
  },
};

export default initializer(
  {
    name: 'errorHandler',
    type: 'service',
    inject: [
      'ENV',
      '?DEBUG_NODE_ENVS',
      '?STRINGIFYERS',
      '?ERRORS_DESCRIPTORS',
      '?DEFAULT_ERROR_CODE',
    ],
  },
  initErrorHandler,
);

/**
 * Initialize an error handler for the
 * HTTP router
 * @param  {Object}   services
 * The services the server depends on
 * @param  {Object}   services.ENV
 * The app ENV
 * @param  {Array}   [services.DEBUG_NODE_ENVS]
 * The environnement that activate debugging
 *  (prints stack trace in HTTP errors responses)
 * @param  {Object} [services.STRINGIFYERS]
 * The synchronous body stringifyers
 * @param  {Object} [services.ERRORS_DESCRIPTORS]
 * An hash of the various error descriptors
 * @param  {Object} [services.DEFAULT_ERROR_CODE]
 * A string giving the default error code
 * @return {Promise}
 * A promise of a function to handle errors
 */
async function initErrorHandler({
  ENV,
  DEBUG_NODE_ENVS = DEFAULT_DEBUG_NODE_ENVS,
  STRINGIFYERS = DEFAULT_STRINGIFYERS,
  ERRORS_DESCRIPTORS = DEFAULT_ERRORS_DESCRIPTORS,
  DEFAULT_ERROR_CODE = DEFAULT_DEFAULT_ERROR_CODE,
}: WhookErrorHandlerDependencies): Promise<WhookErrorHandler> {
  // Ensure we have required error descriptors
  ERRORS_DESCRIPTORS = {
    ...DEFAULT_ERRORS_DESCRIPTORS,
    ...ERRORS_DESCRIPTORS,
  };

  return errorHandler;

  /**
   * Handle an HTTP transaction error and
   * map it to a serializable response
   * @param  {String}  transactionId
   * A raw NodeJS HTTP incoming message
   * @param  {Object} responseSpec
   * The response specification
   * @param  {YHTTPError} err
   * The encountered error
   * @return {Promise}
   * A promise resolving when the operation
   *  completes
   */
  async function errorHandler(
    transactionId: string,
    responseSpec: WhookResponseSpec,
    err: Error | YError | YHTTPError,
  ) {
    const errorCode = (err as YError).code || DEFAULT_ERROR_CODE;
    const errorDescriptor =
      ERRORS_DESCRIPTORS[errorCode] ||
      ERRORS_DESCRIPTORS[DEFAULT_DEFAULT_ERROR_CODE];
    const response: WhookErrorResponse = {
      status:
        (errorDescriptor !== ERRORS_DESCRIPTORS[DEFAULT_DEFAULT_ERROR_CODE] &&
        errorDescriptor.status
          ? errorDescriptor.status
          : undefined) ||
        (err as YHTTPError).httpCode ||
        ERRORS_DESCRIPTORS[DEFAULT_DEFAULT_ERROR_CODE].status ||
        500,
      headers: Object.assign({}, (err as YHTTPError).headers || {}, {
        // Avoid caching errors
        'cache-control': 'private' as const,
        // Fallback to the default stringifyer to always be
        // able to display errors
        'content-type':
          responseSpec &&
          responseSpec.contentTypes[0] &&
          STRINGIFYERS[responseSpec.contentTypes[0]]
            ? responseSpec.contentTypes[0]
            : Object.keys(STRINGIFYERS)[0],
      }),
      // Here we do not respect the camelCase convention to
      // have OAuth2 compatible errors 🤷
      body: {
        error: errorDescriptor.code,
        error_description: replaceTemplatedValues(
          err as YError,
          errorDescriptor.description as string,
        ),
        error_uri: replaceTemplatedValues(
          err as YError,
          errorDescriptor.uri as string,
        ),
        error_help_uri: replaceTemplatedValues(
          err as YError,
          errorDescriptor.help as string,
        ),
        error_params: errorDescriptor.transmittedParams
          ? errorDescriptor.transmittedParams.map(
              (paramIndex) => ((err as YError).params || [])[paramIndex],
            )
          : undefined,
        error_debug_data: {
          // Enjoy nerdy stuff:
          // https://en.wikipedia.org/wiki/Guru_Meditation
          guruMeditation: transactionId,
        },
      },
    };

    if (DEBUG_NODE_ENVS.includes(ENV.NODE_ENV)) {
      response.body.error_debug_data.code = errorCode;
      response.body.error_debug_data.stack = printStackTrace(err as Error);
      response.body.error_debug_data.params = (err as YError).params;
    }

    return response;
  }
}

function replaceTemplatedValues(err: YError, str: string): string | undefined {
  return str
    ? str
        .replace(/\$([0-9](:?\.[a-zA-Z0-9#@*]+)*)/g, (_, path) =>
          miniquery(path, err.params ? [err.params] : []).join(', '),
        )
        .replace(/\$code/, (err as YError).code)
    : undefined;
}
