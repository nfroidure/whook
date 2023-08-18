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
import type { WhookPluginsPathsConfig } from './services/WHOOK_PLUGINS_PATHS.js';
import type { WhookWrappersConfig } from './services/WRAPPERS.js';
import type { WhookAutoloadConfig } from './services/_autoload.js';
import type { WhookCompilerConfig } from './services/compiler.js';
import type {
  ProcessEnvConfig,
  ProcessServiceConfig,
} from 'application-services';

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
  WhookAutoloadConfig &
  WhookBaseURLConfig &
  WhookPluginsPathsConfig &
  WhookObfuscatorConfig &
  WhookAPIDefinitionsConfig &
  WhookCompilerConfig &
  WhookWrappersConfig;
