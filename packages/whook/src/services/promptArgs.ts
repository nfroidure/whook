/* eslint-disable @typescript-eslint/no-explicit-any */
import { autoService, location, singleton } from 'knifecycle';
import _inquirer from 'inquirer';
import { noop, type LogService } from 'common-services';
import {
  type WhookArgsTypes,
  type WhookCommandArgs,
  type WhookCommandDefinitionArguments,
} from '../libs/args.js';

export default location(
  singleton(autoService(initPromptArgs)),
  import.meta.url,
);

export type WhookCommandHandler = () => Promise<void>;
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
    const questions = (COMMAND_DEFINITION.arguments.required || []).reduce<
      any[]
    >((questions, propertyName) => {
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

    const questionsResponses = (await inquirer.prompt(
      questions as any,
    )) as Partial<WhookCommandArgs<T>['namedArguments']>;

    return {
      ...args,
      namedArguments: {
        ...args.namedArguments,
        ...questionsResponses,
      },
    };
  };
}
