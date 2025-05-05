import {
  DEFAULT_ERROR_URI,
  DEFAULT_HELP_URI,
  type WhookErrorsDescriptors,
} from '@whook/whook';
import initWrapRouteHandlerWithAuthorization from './wrappers/wrapRouteHandlerWithAuthorization.js';

export { initWrapRouteHandlerWithAuthorization };
export {
  type WhookAuthenticationApplicationId,
  type WhookAuthenticationScope,
  type WhookBaseAuthenticationData,
  type WhookAuthenticationData,
  type WhookAuthenticationService,
  type WhookAuthorizationConfig,
  type WhookAuthorizationDependencies,
  type WhookAuthenticationExtraParameters,
} from './wrappers/wrapRouteHandlerWithAuthorization.js';

export const AUTHORIZATION_ERRORS_DESCRIPTORS: WhookErrorsDescriptors = {
  E_OPERATION_REQUIRED: {
    code: 'server_misconfiguration',
    description:
      'The authorization wrapper needs to have the operation passed in',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNAUTHORIZED: {
    code: 'unauthorized_client',
    description: 'Access refused to this resource for the authenticated client',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_UNALLOWED_AUTH_MECHANISM: {
    code: 'bad_request',
    description: 'Unsupported auth mecanism',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
  E_MISCONFIGURATION: {
    code: 'bad_handler',
    description:
      'The operation "$2" is misconfigured for the authorization type "$0"',
    uri: DEFAULT_ERROR_URI,
    help: DEFAULT_HELP_URI,
  },
};
