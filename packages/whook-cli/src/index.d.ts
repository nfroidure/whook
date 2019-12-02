import { readArgs } from './libs/args';
import { WhookCommandArgs } from './services/args';
import {
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from './services/promptArgs';
export {
  readArgs,
  WhookArgsTypes,
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
  WhookCommandArgs,
};
export default function run({
  prepareEnvironment,
}: {
  prepareEnvironment: any;
}): Promise<void>;
