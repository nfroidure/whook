import { extra, autoService } from 'knifecycle';
import { readArgs } from '../libs/args.js';
import { YError } from 'yerror';
import camelCase from 'camelcase';
import { HANDLER_REG_EXP } from '@whook/whook';
import _inquirer from 'inquirer';
import path from 'path';
import { OPEN_API_METHODS, noop } from '@whook/whook';
import { default as fsExtra } from 'fs-extra';
import type {
  WhookCommandHandler,
  WhookCommandDefinition,
  PromptArgs,
} from '../services/promptArgs.js';
import type { LogService } from 'common-services';
import type { OpenAPIV3 } from 'openapi-types';

const {
  writeFile: _writeFile,
  ensureDir: _ensureDir,
  pathExists: _pathExists,
} = fsExtra;

// Currently, we rely on a static list of services but
// best would be to use TypeScript introspection and
// the autoloader to allow to retrieve a dynamic list
// of constants from the CONFIGS service, the WhookConfigs
// type and the autoloader service.
const commonServicesTypes = {
  time: 'TimeService',
  log: 'LogService',
  random: 'RandomService',
  delay: 'DelayService',
  process: 'ProcessService',
};
const whookSimpleTypes = {
  HOST: 'string',
  PORT: 'number',
  PROJECT_DIR: 'string',
  PROJECT_SRC: 'string',
  NODE_ENV: 'string',
  DEBUG_NODE_ENVS: 'string[]',
  WHOOK_PLUGINS_PATHS: 'string[]',
};
const whookServicesTypes = {
  API_DEFINITIONS: 'DelayService',
  ENV: 'ENVService',
  APM: 'APMService',
  CONFIGS: 'CONFIGSService',
};
const allTypes = {
  ...commonServicesTypes,
  ...whookSimpleTypes,
  ...whookServicesTypes,
};

export const definition: WhookCommandDefinition = {
  description: 'A command helping to create new Whook files easily',
  example: `whook create --type service --name "db"`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'name'],
    properties: {
      type: {
        description: 'Type',
        type: 'string',
        enum: ['handler', 'service', 'provider', 'command'],
      },
      name: {
        description: 'Name',
        type: 'string',
      },
    },
  },
};

export default extra(definition, autoService(initCreateCommand));

async function initCreateCommand({
  PROJECT_DIR,
  API,
  inquirer = _inquirer,
  promptArgs,
  writeFile = _writeFile,
  ensureDir = _ensureDir,
  pathExists = _pathExists,
  log = noop,
}: {
  PROJECT_DIR: string;
  API: OpenAPIV3.Document;
  inquirer: typeof _inquirer;
  promptArgs: PromptArgs;
  writeFile: typeof _writeFile;
  ensureDir: typeof _ensureDir;
  pathExists: typeof _pathExists;
  log?: LogService;
}): Promise<WhookCommandHandler> {
  return async () => {
    const {
      namedArguments: { type, name },
    } = readArgs<{ type: string; name: string }>(
      definition.arguments,
      await promptArgs(),
    );
    const finalName = camelCase(name);

    if (name !== finalName) {
      log('warning', `🐪 - Camelized the name "${finalName}".`);
    }

    if (type === 'handler' && !HANDLER_REG_EXP.test(finalName)) {
      log(
        'error',
        `💥 - The handler name is invalid, "${finalName}" does not match "${HANDLER_REG_EXP}".`,
      );
      throw new YError('E_BAD_HANDLER_NAME', finalName, HANDLER_REG_EXP);
    }

    const { services } = (await inquirer.prompt([
      {
        name: 'services',
        type: 'checkbox',
        message: 'Which services do you want to use?',
        choices: [
          ...Object.keys(commonServicesTypes),
          ...Object.keys(whookSimpleTypes),
          ...Object.keys(whookServicesTypes),
        ],
      },
    ])) as { services: string[] };

    const servicesTypes = services
      .sort()
      .map((name) => ({
        name,
        type: allTypes[name],
      }))
      .concat(
        type === 'command' ? [{ name: 'promptArgs', type: 'PromptArgs' }] : [],
      );
    const parametersDeclaration = servicesTypes.length
      ? `{${servicesTypes
          .map(
            ({ name }) => `
  ${name},`,
          )
          .join('')}
}`
      : '';
    const typesDeclaration = servicesTypes.length
      ? `{${servicesTypes
          .map(
            ({ name, type }) => `
  ${name}: ${type};`,
          )
          .join('')}
}`
      : '';
    const commonServices = services.filter(
      (service) => commonServicesTypes[service],
    );
    const whookServices = services.filter(
      (service) => whookServicesTypes[service],
    );
    const imports = `${
      type === 'command'
        ? `
import {
  readArgs,
} from '@whook/cli';
import type {
  PromptArgs,
  WhookCommandArgs,
  WhookCommandDefinition,
  WhookCommandHandler,
} from '@whook/cli';`
        : ''
    }${
      commonServices.length
        ? `
import type { ${commonServices
            .map((name) => commonServicesTypes[name])
            .join(', ')} } from 'common-services';`
        : ''
    }${
      whookServices.length
        ? `
import type { ${whookServices
            .map((name) => whookServicesTypes[name])
            .join(', ')} } from '@whook/whook';`
        : ''
    }
`;
    let fileSource = '';

    if (type === 'handler') {
      let baseQuestions = [
        {
          name: 'method',
          type: 'list',
          message: 'Give the handler method',
          choices: OPEN_API_METHODS,
          default: [(HANDLER_REG_EXP.exec(finalName) as string[])[1]].filter(
            (maybeMethod) => OPEN_API_METHODS.includes(maybeMethod),
          )[0],
        },
        {
          name: 'path',
          type: 'input',
          message: 'Give the handler path',
        },
        {
          name: 'description',
          type: 'input',
          message: 'Give the handler description',
        },
      ] as _inquirer.Answers[];
      if (API.tags && API.tags.length) {
        baseQuestions = [
          ...baseQuestions,
          {
            name: 'tags',
            type: 'checkbox',
            message: 'Assing one or more tags to the handler',
            choices: API.tags.map(({ name }) => name),
          },
        ];
      }
      const { method, path, description, tags } = (await inquirer.prompt(
        baseQuestions,
      )) as {
        method: string;
        path: string;
        description: string;
        tags: string[];
      };
      fileSource = buildHandlerSource(
        name,
        path,
        method,
        description,
        tags,
        parametersDeclaration,
        typesDeclaration,
        imports,
      );
    } else if (type === 'service') {
      fileSource = buildServiceSource(
        name,
        parametersDeclaration,
        typesDeclaration,
        imports,
      );
    } else if (type === 'provider') {
      fileSource = buildProviderSource(
        name,
        parametersDeclaration,
        typesDeclaration,
        imports,
      );
    } else if (type === 'command') {
      const { description } = (await inquirer.prompt([
        {
          name: 'description',
          message: 'Give the command description',
        },
      ])) as { description: string };

      fileSource = buildCommandSource(
        name,
        description,
        parametersDeclaration,
        typesDeclaration,
        imports,
      );
    } else {
      throw new YError('E_UNEXPECTED_TYPE');
    }

    const fileDir = path.join(
      PROJECT_DIR,
      'src',
      ['service', 'provider'].includes(type)
        ? 'services'
        : type === 'handler'
        ? 'handlers'
        : 'commands',
    );
    await ensureDir(fileDir);
    const filePath = path.join(fileDir, `${name}.ts`);
    if (await pathExists(filePath)) {
      log('warning', '⚠️ - The file already exists !');

      const { erase } = (await inquirer.prompt([
        {
          name: 'Erase ?',
          type: 'confirm',
        },
      ])) as {
        erase: boolean;
      };

      if (!erase) {
        return;
      }
    }
    await writeFile(filePath, fileSource);
  };
}

function buildHandlerSource(
  name: string,
  path: string,
  method: string,
  description = '',
  tags: string[] = [],
  parametersDeclaration,
  typesDeclaration,
  imports: string,
) {
  const APIHandlerName = name[0].toUpperCase() + name.slice(1);

  return `import { autoHandler } from 'knifecycle';
import type { WhookAPIHandlerDefinition } from '@whook/whook';${imports}

export const definition: WhookAPIHandlerDefinition = {
  path: '${path}',
  method: '${method}',
  operation: {
    operationId: '${name}',
    summary: '${description.replace(/'/g, "\\'")}',
    tags: [${tags.map((tag) => `'${tag}'`).join(', ')}],
    parameters: [
      {
        name: 'param',
        in: 'query',
        required: false,
        schema: { type: 'number' },
      },
    ],${
      ['post', 'put', 'patch'].includes(method)
        ? `
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
          },
        },
      },
    },`
        : ''
    }
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  },
};

type HandlerDependencies = ${typesDeclaration || '{}'};

export default autoHandler(${name});

async function ${name}(${parametersDeclaration || '_'}: HandlerDependencies, {
    param,${
      ['post', 'put'].includes(method)
        ? `
    body,`
        : ''
    }
  } : API.${APIHandlerName}.Input): Promise<API.${APIHandlerName}.Output> {
  return {
    status: 200,
    headers: {},
    body: { param },
  };
}
`;
}

function buildServiceSource(
  name: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);

  return `import { autoService } from 'knifecycle';${imports}

export type ${upperCamelizedName}Service = {};
export type ${upperCamelizedName}Dependencies = ${typesDeclaration || '{}'};

export default autoService(init${upperCamelizedName});

async function init${upperCamelizedName}(${
    parametersDeclaration || '_'
  }: ${upperCamelizedName}Dependencies): Promise<${upperCamelizedName}Service> {
  // Instantiate and return your service
  return {};
}
`;
}

function buildProviderSource(
  name: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);

  return `import { autoProvider, Provider } from 'knifecycle';${imports}

export type ${upperCamelizedName}Service = {};
export type ${upperCamelizedName}Provider = Provider<${upperCamelizedName}Service>;
export type ${upperCamelizedName}Dependencies = ${typesDeclaration || '{}'};

export default autoProvider(init${upperCamelizedName});

async function init${upperCamelizedName}(${
    parametersDeclaration || '_'
  }: ${upperCamelizedName}Dependencies): Promise<${upperCamelizedName}Provider> {
  // Instantiate and return your service
  return {
    service: {},
    dispose: async () => {
      // Do any action before the process shutdown
      // (closing db connections... etc)
    },
    // You can also set a promise for unexpected errors
    //  that shutdown the app when it happens
    // errorPromise: new Promise(),
  };
}
`;
}

function buildCommandSource(
  name: string,
  description: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);

  return `import { extra, autoService } from 'knifecycle';${imports}

export const definition: WhookCommandDefinition = {
  description: '${description.replace(/'/g, "\\'")}',
  example: \`whook ${name} --param "value"\`,
  arguments: {
    type: 'object',
    additionalProperties: false,
    required: ['param'],
    properties: {
      param: {
        description: 'A parameter',
        type: 'string',
        default: 'A default value',
      },
    },
  },
};

export default extra(definition, autoService(init${upperCamelizedName}Command));

async function init${upperCamelizedName}Command(${
    parametersDeclaration || '_'
  }: ${typesDeclaration || {}}): Promise<WhookCommandHandler> {
  return async () => {
    const { param } = readArgs(
      definition.arguments,
      await promptArgs(),
    ) as { param: string; };

  // Implement your command here
  }
}
`;
}
