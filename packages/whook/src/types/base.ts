import { type WhookHTTPRouterConfig } from '../services/httpRouter.js';
import {
  type WhookHTTPServerConfig,
  type WhookHTTPServerEnv,
} from '../services/httpServer.js';
import {
  type WhookHTTPSServerConfig,
  type WhookHTTPSServerEnv,
} from '../services/httpsServer.js';
import {
  WhookBasePath,
  WhookBaseURL,
  type WhookBaseURLConfig,
  type WhookBaseURLEnv,
} from '../services/BASE_URL.js';
import {
  type WhookBasePathConfig,
  type WhookBasePathEnv,
} from '../services/BASE_PATH.js';
import { type WhookPortEnv } from '../services/PORT.js';
import { type WhookObfuscatorConfig } from '../services/obfuscator.js';
import { type WhookHTTPTransactionConfig } from '../services/httpTransaction.js';
import { type WhookHostEnv } from '../services/HOST.js';
import { type WhookDefinitionsConfig } from '../services/DEFINITIONS.js';
import { type WhookResolvedPluginsConfig } from '../services/WHOOK_RESOLVED_PLUGINS.js';
import { type WhookRoutesWrappersConfig } from '../services/ROUTES_WRAPPERS.js';
import {
  type ProcessEnvConfig,
  type ProcessServiceConfig,
} from 'application-services';
import { type WhookErrorHandlerConfig } from '../services/errorHandler.js';
import { type WhookSchemaValidatorsConfig } from '../services/schemaValidators.js';
import { type WhookQueryParserBuilderConfig } from '../services/queryParserBuilder.js';
import { type WhookCommandEnv } from '../services/command.js';
import { type WhookCommandsDeclarationsConfig } from '../services/COMMANDS_DECLARATIONS.js';
import { type WhookConsumersDeclarationsConfig } from '../services/CONSUMERS_DECLARATIONS.js';
import { type WhookCronsDeclarationsConfig } from '../services/CRONS_DECLARATIONS.js';
import { type WhookTransformersDeclarationsConfig } from '../services/TRANSFORMERS_DECLARATIONS.js';
import { type WhookRoutesDeclarationsConfig } from '../services/ROUTES_DECLARATIONS.js';
import { type WhookSSLCertificatesEnv } from '../services/SSL_CERTIFICATES.js';
import { WhookAPISchemaDefinition } from './openapi.js';

export type WhookAppEnv<T extends string> = T;

export interface WhookBaseMain {
  AppEnv: WhookAppEnv<string>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface WhookMain extends WhookBaseMain {}

export type WhookBaseEnv = WhookCommandEnv &
  WhookHTTPServerEnv &
  WhookHTTPSServerEnv &
  WhookSSLCertificatesEnv &
  WhookBaseURLEnv &
  WhookBasePathEnv &
  WhookHostEnv &
  WhookPortEnv & {
    APP_ENV?: WhookBaseMain['AppEnv'];
  };

export type WhookBaseConfigs = ProcessServiceConfig &
  ProcessEnvConfig &
  ProcessServiceConfig &
  WhookHTTPRouterConfig &
  WhookQueryParserBuilderConfig &
  WhookErrorHandlerConfig &
  WhookHTTPServerConfig &
  WhookHTTPSServerConfig &
  WhookHTTPTransactionConfig &
  WhookBaseURLConfig &
  WhookBasePathConfig &
  WhookResolvedPluginsConfig &
  WhookObfuscatorConfig &
  WhookDefinitionsConfig &
  WhookRoutesWrappersConfig &
  WhookSchemaValidatorsConfig &
  WhookCommandsDeclarationsConfig &
  WhookConsumersDeclarationsConfig &
  WhookCronsDeclarationsConfig &
  WhookTransformersDeclarationsConfig &
  WhookRoutesDeclarationsConfig & {
    BASE_URL?: WhookBaseURL;
    BASE_PATH?: WhookBasePath;
  };

export type WhookSchemasDeclarationModule = Record<
  `${string}Schema`,
  WhookAPISchemaDefinition<unknown>
>;
