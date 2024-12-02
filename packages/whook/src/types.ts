import type {
  WhookObfuscatorConfig,
  WhookHTTPTransactionConfig,
} from '@whook/http-transaction';
import type {
  WhookErrorHandlerConfig,
  WhookHTTPRouterConfig,
} from '@whook/http-router';
import type {
  WhookHTTPServerConfig,
  WhookHTTPServerEnv,
} from '@whook/http-server';
import type {
  WhookBaseURLConfig,
  WhookBaseURLEnv,
} from './services/BASE_URL.js';
import type { WhookPortEnv } from './services/PORT.js';
import type { WhookHostEnv } from './services/HOST.js';
import type { WhookAPIDefinitionsConfig } from './services/API_DEFINITIONS.js';
import type { WhookResolvedPluginsConfig } from './services/WHOOK_RESOLVED_PLUGINS.js';
import type { WhookWrappersConfig } from './services/WRAPPERS.js';
import type { WhookCompilerConfig } from './services/compiler.js';
import type {
  ProcessEnvConfig,
  ProcessServiceConfig,
} from 'application-services';
import type { OpenAPITypesConfig } from './commands/generateOpenAPITypes.js';

export type WhookBaseEnv = WhookHTTPServerEnv &
  WhookBaseURLEnv &
  WhookHostEnv &
  WhookPortEnv;

export type WhookBaseConfigs = ProcessServiceConfig &
  ProcessEnvConfig &
  ProcessServiceConfig &
  WhookHTTPRouterConfig &
  WhookErrorHandlerConfig &
  WhookHTTPServerConfig &
  WhookHTTPTransactionConfig &
  WhookBaseURLConfig &
  WhookResolvedPluginsConfig &
  WhookObfuscatorConfig &
  WhookAPIDefinitionsConfig &
  WhookCompilerConfig &
  WhookWrappersConfig &
  OpenAPITypesConfig;
