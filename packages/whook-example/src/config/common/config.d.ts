import { WhookAuthorizationConfig } from '@whook/authorization';
import { WhookSwaggerUIConfig } from '@whook/swagger-ui';
import { CORSConfig } from '@whook/cors';
import { WhookConfigs } from '@whook/whook';
import { AuthenticationConfig } from '../../services/authentication';
import { APIConfig } from '../../services/API';
export declare type AppConfigs = WhookConfigs &
  AuthenticationConfig &
  WhookAuthorizationConfig &
  WhookSwaggerUIConfig &
  CORSConfig &
  APIConfig;
declare const CONFIG: AppConfigs;
export default CONFIG;
