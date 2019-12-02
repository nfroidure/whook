import { LogService } from 'common-services';
import { WhookArgsTypes } from '..';
declare const _default: typeof initArgs;
export default _default;
interface WhookCommandNamedArgs {
  [name: string]: WhookArgsTypes;
}
interface WhookCommandArgsRest {
  _?: string[];
}
export declare type WhookCommandArgs = WhookCommandNamedArgs &
  WhookCommandArgsRest;
declare function initArgs({
  ARGS,
  log,
}: {
  ARGS: string[];
  log: LogService;
}): Promise<WhookCommandArgs>;
