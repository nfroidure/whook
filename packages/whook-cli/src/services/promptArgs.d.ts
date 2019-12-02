import _inquirer from 'inquirer';
import { LogService } from 'common-services';
import { WhookCommandArgs } from './args';
declare const _default: typeof initPromptArgs;
export default _default;
export declare type WhookArgsTypes = string | boolean | number;
export declare type WhookCommandHandler = () => Promise<void>;
export declare type WhookCommandDefinitionArguments = {
  type: 'object';
  required?: string[];
  additionalProperties: false;
  properties: {
    [name: string]: {
      type: 'boolean' | 'string' | 'number';
      description: string;
      enum?: WhookArgsTypes[];
      default?: string | boolean | number;
    };
  };
};
export declare type WhookCommandDefinition = {
  description: string;
  example: string;
  arguments: WhookCommandDefinitionArguments;
};
export declare type PromptArgs = () => Promise<{
  [name: string]: any;
}>;
declare function initPromptArgs({
  COMMAND_DEFINITION,
  args,
  inquirer,
  log,
}: {
  COMMAND_DEFINITION: WhookCommandDefinition;
  args: WhookCommandArgs;
  inquirer?: typeof _inquirer;
  log?: LogService;
}): Promise<PromptArgs>;
