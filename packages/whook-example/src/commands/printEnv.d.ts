import { LogService } from 'common-services';
import { ENVService } from '@whook/whook';
import { WhookCommandArgs, WhookCommandDefinition } from '@whook/cli';
export declare const definition: WhookCommandDefinition;
declare const _default: typeof initPrintEnvCommand;
export default _default;
declare function initPrintEnvCommand({
  ENV,
  log,
  args,
}: {
  ENV: ENVService;
  log: LogService;
  args: WhookCommandArgs;
}): Promise<() => Promise<void>>;
