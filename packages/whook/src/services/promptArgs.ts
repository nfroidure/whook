import { autoService, singleton } from 'knifecycle';
import _inquirer from 'inquirer';
import { noop } from '../libs/utils.js';
import type { Question } from 'inquirer';
import type { LogService } from 'common-services';
import type { WhookCommandArgs } from './args.js';

export default singleton(autoService(initPromptArgs));

export type WhookArgsTypes = string | boolean | number;
export type WhookCommandHandler = () => Promise<void>;
// Subset of JSON Schema types so not using @types/json-schema
export type WhookCommandDefinitionArguments = {
  type: 'object';
  required?: string[];
  additionalProperties: false;
  properties: Record<
    string,
    | {
        type: 'boolean' | 'string' | 'number';
        description: string;
        pattern?: string;
        format?: string;
        enum?: WhookArgsTypes[];
        default?: WhookArgsTypes;
      }
    | {
        type: 'array';
        description: string;
        minItems?: number;
        maxItems?: number;
        items: {
          type: 'boolean' | 'string' | 'number';
          description?: string;
          pattern?: string;
          format?: string;
          enum?: WhookArgsTypes[];
          default?: WhookArgsTypes;
        };
        default?: WhookArgsTypes[];
      }
  >;
};
export type WhookCommandDefinition = {
  description: string;
  example: string;
  arguments: WhookCommandDefinitionArguments;
};
export type WhookPromptArgs<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
> = () => Promise<WhookCommandArgs<T>>;

async function initPromptArgs<
  T extends Record<string, WhookArgsTypes> = Record<string, WhookArgsTypes>,
>({
  COMMAND_DEFINITION,
  args,
  inquirer = _inquirer,
  log = noop,
}: {
  COMMAND_DEFINITION: WhookCommandDefinition;
  args: WhookCommandArgs<T>;
  inquirer?: typeof _inquirer;
  log?: LogService;
}): Promise<WhookPromptArgs<T>> {
  log('debug', '🛠 - Initializing promptArgs service');

  return async () => {
    const questions: Question[] = (
      COMMAND_DEFINITION.arguments.required || []
    ).reduce<Question[]>((questions, propertyName) => {
      if ('undefined' === typeof args.namedArguments[propertyName]) {
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
        if (
          propertyDefinition.type === 'string' ||
          propertyDefinition.type === 'number'
        ) {
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
    }, []);

    if (0 === questions.length) {
      return args;
    }

    const questionsResponses = (await inquirer.prompt(questions)) as Partial<
      WhookCommandArgs<T>['namedArguments']
    >;

    return {
      ...args,
      namedArguments: {
        ...args.namedArguments,
        ...questionsResponses,
      },
    };
  };
}
