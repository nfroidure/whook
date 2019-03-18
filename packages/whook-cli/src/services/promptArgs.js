import { autoService, options } from 'knifecycle';
import _inquirer from 'inquirer';

export default options({ singleton: true }, autoService(initPromptArgs));

async function initPromptArgs({
  COMMAND_DEFINITION,
  args,
  inquirer = _inquirer,
  log,
}) {
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
