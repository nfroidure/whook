import parseArgs from 'yargs-parser';
import { autoService, options } from 'knifecycle';
import _inquirer from 'inquirer';
import { LogService } from 'common-services';
import { noop } from '@whook/whook';
import { WhookCommandArgs } from './args';

export default options({ singleton: true }, autoService(initPromptArgs));

export type WhookArgsTypes = string | boolean | number;
export type WhookCommandHandler = () => Promise<void>;
// Subset of JSON Schema types so not using @types/json-schema
export type WhookCommandDefinitionArguments = {
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
export type WhookCommandDefinition = {
  description: string;
  example: string;
  arguments: WhookCommandDefinitionArguments;
};
export type PromptArgs = () => Promise<{ [name: string]: any }>;

async function initPromptArgs({
  COMMAND_DEFINITION,
  args,
  inquirer = _inquirer,
  log = noop,
}: {
  COMMAND_DEFINITION: WhookCommandDefinition;
  args: WhookCommandArgs;
  inquirer?: typeof _inquirer;
  log?: LogService;
}): Promise<PromptArgs> {
  log('debug', '🛠 - Initializing promptArgs service');

  return async () => {
    const questions = (COMMAND_DEFINITION.arguments.required || []).reduce(
      (questions, propertyName) => {
        if ('undefined' === typeof args[propertyName]) {
          const propertyDefinition =
            COMMAND_DEFINITION.arguments.properties[propertyName];

          if (propertyDefinition.type === 'boolean') {
            return [
              ...questions,
              {
                name: propertyName,
                type: 'checkbox',
                message: propertyDefinition.description || '',
              },
            ];
          }
          if (['string', 'number'].includes(propertyDefinition.type)) {
            if (propertyDefinition.enum) {
              return [
                ...questions,
                {
                  name: propertyName,
                  type: 'list',
                  message: propertyDefinition.description || '',
                  choices: propertyDefinition.enum,
                },
              ];
            }

            return [
              ...questions,
              {
                name: propertyName,
                type: 'input',
                message: propertyDefinition.description || '',
              },
            ];
          }
        }
        return questions;
      },
      [],
    );

    if (0 === questions.length) {
      return args;
    }

    return {
      ...args,
      ...(await inquirer.prompt(questions)),
    };
  };
}
