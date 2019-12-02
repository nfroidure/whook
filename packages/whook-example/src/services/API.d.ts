import { ENVService, WhookConfig } from '@whook/whook';
import { LogService } from 'common-services';
declare const _default: typeof initAPI;
export default _default;
declare function initAPI({
  ENV,
  CONFIG,
  BASE_URL,
  BASE_PATH,
  API_VERSION,
  log,
}: {
  ENV: ENVService;
  CONFIG: WhookConfig;
  BASE_URL: string;
  BASE_PATH?: string;
  API_VERSION: string;
  log?: LogService;
}): Promise<import('openapi-types').OpenAPIV3.Document>;
