import { WhookConfig } from '@whook/whook';
import { LogService } from 'common-services';
import { OpenAPIV3 } from 'openapi-types';
export declare type APIEnv = {
  DEV_MODE?: string;
};
export declare type APIConfig = {
  ENV?: APIEnv;
  CONFIG: WhookConfig;
  BASE_URL?: string;
  BASE_PATH?: string;
  API_VERSION: string;
};
export declare type APIDependencies = APIConfig & {
  ENV: APIEnv;
  BASE_URL: string;
  log?: LogService;
};
declare const _default: typeof initAPI;
export default _default;
declare function initAPI({
  ENV,
  CONFIG,
  BASE_URL,
  BASE_PATH,
  API_VERSION,
  log,
}: APIDependencies): Promise<OpenAPIV3.Document>;
