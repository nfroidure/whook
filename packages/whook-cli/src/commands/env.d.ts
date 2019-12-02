import { WhookCommandDefinition, PromptArgs } from '../services/promptArgs';
import { ENVService } from '@whook/whook';
import { LogService } from 'common-services';
export declare const definition: WhookCommandDefinition;
declare const _default: typeof initEnvCommand;
export default _default;
declare function initEnvCommand({
  ENV,
  promptArgs,
  log,
}: {
  ENV: ENVService;
  promptArgs: PromptArgs;
  log?: LogService;
}): Promise<() => Promise<void>>;
