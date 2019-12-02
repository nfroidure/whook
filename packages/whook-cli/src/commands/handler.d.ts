import { Injector } from 'knifecycle';
import {
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandHandler,
} from '../services/promptArgs';
import { WhookHandler } from '@whook/whook';
import { LogService } from 'common-services';
export declare const definition: WhookCommandDefinition;
declare const _default: typeof initHandlerCommand;
export default _default;
declare function initHandlerCommand({
  $injector,
  log,
  promptArgs,
}: {
  $injector: Injector<WhookHandler>;
  log?: LogService;
  promptArgs: PromptArgs;
}): Promise<WhookCommandHandler>;
