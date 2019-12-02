/// <reference types="node" />
/// <reference types="jest" />
import os from 'os';
import {
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandHandler,
} from '../services/promptArgs';
import { LogService } from 'common-services';
import {
  CONFIGSService,
  WhookPluginsService,
  WhookPluginsPathsService,
} from '@whook/whook';
declare const _require: NodeRequire;
export declare const definition: WhookCommandDefinition;
declare const _default: typeof initLsCommand;
export default _default;
declare function initLsCommand({
  CONFIG,
  PROJECT_SRC,
  WHOOK_PLUGINS,
  WHOOK_PLUGINS_PATHS,
  readDir,
  log,
  promptArgs,
  EOL,
  require,
}: {
  CONFIG: CONFIGSService;
  PROJECT_SRC: string;
  WHOOK_PLUGINS: WhookPluginsService;
  WHOOK_PLUGINS_PATHS: WhookPluginsPathsService;
  readDir?: typeof _readDir;
  log?: LogService;
  promptArgs: PromptArgs;
  EOL?: typeof os.EOL;
  require?: typeof _require;
}): Promise<WhookCommandHandler>;
declare function _readDir(dir: string): Promise<string[]>;
