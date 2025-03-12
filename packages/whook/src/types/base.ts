import { type WhookHTTPRouterConfig } from '../services/httpRouter.js';
import {
  type WhookHTTPServerConfig,
  type WhookHTTPServerEnv,
} from '../services/httpServer.js';
import {
  type WhookBaseURLConfig,
  type WhookBaseURLEnv,
} from '../services/BASE_URL.js';
import { type WhookPortEnv } from '../services/PORT.js';
import { type WhookObfuscatorConfig } from '../services/obfuscator.js';
import { type WhookHTTPTransactionConfig } from '../services/httpTransaction.js';
import { type WhookHostEnv } from '../services/HOST.js';
import { type WhookDefinitionsConfig } from '../services/DEFINITIONS.js';
import { type WhookResolvedPluginsConfig } from '../services/WHOOK_RESOLVED_PLUGINS.js';
import { type WhookRoutesWrappersConfig } from '../services/ROUTES_WRAPPERS.js';
import { type WhookCompilerConfig } from '../services/compiler.js';
import {
  type ProcessEnvConfig,
  type ProcessServiceConfig,
} from 'application-services';
import { type OpenAPITypesConfig } from '../commands/generateOpenAPITypes.js';
import { type WhookErrorHandlerConfig } from '../services/errorHandler.js';
import { type WhookSchemaValidatorsConfig } from '../services/schemaValidators.js';
import { type WhookQueryParserBuilderConfig } from '../services/queryParserBuilder.js';

export type WhookBaseMain = {
  AppEnv: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookMain extends WhookBaseMain {}

export type WhookBaseEnv = WhookHTTPServerEnv &
  WhookBaseURLEnv &
  WhookHostEnv &
  WhookPortEnv;

export type WhookBaseConfigs = ProcessServiceConfig &
  ProcessEnvConfig &
  ProcessServiceConfig &
  WhookHTTPRouterConfig &
  WhookQueryParserBuilderConfig &
  WhookErrorHandlerConfig &
  WhookHTTPServerConfig &
  WhookHTTPTransactionConfig &
  WhookBaseURLConfig &
  WhookResolvedPluginsConfig &
  WhookObfuscatorConfig &
  WhookDefinitionsConfig &
  WhookCompilerConfig &
  WhookRoutesWrappersConfig &
  WhookSchemaValidatorsConfig &
  OpenAPITypesConfig;
