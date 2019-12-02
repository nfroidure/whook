import { LogService } from 'common-services';
import { CONFIGSService } from '@whook/whook';
import {
  PromptArgs,
  WhookCommandDefinition,
  WhookCommandHandler,
} from '../services/promptArgs';
export declare const definition: WhookCommandDefinition;
declare const _default: typeof initConfigCommand;
export default _default;
declare function initConfigCommand({
  CONFIGS,
  promptArgs,
  log,
}: {
  CONFIGS: CONFIGSService;
  promptArgs: PromptArgs;
  log?: LogService;
}): Promise<WhookCommandHandler>;
