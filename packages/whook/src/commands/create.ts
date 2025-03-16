import { location, autoService } from 'knifecycle';
import { noop } from '../libs/utils.js';
import { YError } from 'yerror';
import camelCase from 'camelcase';
import _inquirer from 'inquirer';
import path from 'node:path';
import { default as fsExtra } from 'fs-extra';
import { type LogService } from 'common-services';
import { type OpenAPI, PATH_ITEM_METHODS } from 'ya-open-api-types';
import {
  type WhookCommandHandler,
  type WhookCommandDefinition,
} from '../types/commands.js';
import {
  DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  type WhookRoutesDefinitionsOptions,
} from '../services/ROUTES_DEFINITIONS.js';
import {
  DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  type WhookCronDefinitionsOptions,
} from '../services/CRONS_DEFINITIONS.js';

const {
  writeFile: _writeFile,
  ensureDir: _ensureDir,
  pathExists: _pathExists,
} = fsExtra;

// Currently, we rely on a static list of services but
// best would be to use TypeScript introspection and
// the autoloader to allow to retrieve a dynamic list
// of constants from the APP_CONFIG service, the AppConfig
// type and the autoloader service.
const commonServicesTypes = {
  codeGenerator: 'CodeGeneratorService',
  counter: 'CounterService',
  delay: 'DelayService',
  importer: 'ImporterService',
  lock: 'LockService',
  log: 'LogService',
  random: 'RandomService',
  resolve: 'ResolveService',
  time: 'TimeService',
};
const applicationServicesTypes = {
  APP_CONFIG: 'AppConfig',
  ENV: 'AppEnvVars',
  process: 'ProcessService',
  PROJECT_DIR: 'ProjectDirService',
};
const whookSimpleTypes = {
  MAIN_FILE_URL: 'string',
  DEBUG_NODE_ENVS: 'string[]',
};
const whookServicesTypes = {
  BASE_URL: 'WhookBaseURL',
  HOST: 'WhookHost',
  PORT: 'WhookPort',
  DEFINITIONS: 'WhookDefinitions',
  APM: 'APMService',
};
const allTypes = {
  ...commonServicesTypes,
  ...applicationServicesTypes,
  ...whookSimpleTypes,
  ...whookServicesTypes,
};

export const definition = {
  name: 'create',
  description: 'A command helping to create new Whook files easily',
  example: `whook create --type service --name "db"`,
  config: {
    environments: ['development'],
    promptArgs: true,
  },
  arguments: [
    {
      name: 'type',
      description: 'Type',
      required: true,
      schema: {
        type: 'string',
        enum: ['route', 'service', 'provider', 'cron', 'command'],
      },
    },
    {
      name: 'name',
      description: 'Name',
      required: true,
      schema: {
        type: 'string',
      },
    },
  ],
} as const satisfies WhookCommandDefinition;

async function initCreateCommand({
  PROJECT_DIR,
  ROUTES_DEFINITIONS_OPTIONS = DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  CRONS_DEFINITIONS_OPTIONS = DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  API,
  inquirer = _inquirer,
  writeFile = _writeFile,
  ensureDir = _ensureDir,
  pathExists = _pathExists,
  log = noop,
}: {
  PROJECT_DIR: string;
  ROUTES_DEFINITIONS_OPTIONS?: WhookRoutesDefinitionsOptions;
  CRONS_DEFINITIONS_OPTIONS?: WhookCronDefinitionsOptions;
  API: OpenAPI;
  inquirer: typeof _inquirer;
  writeFile: (path: string, data: string) => Promise<void>;
  ensureDir: typeof _ensureDir;
  pathExists: typeof _pathExists;
  log?: LogService;
}): Promise<WhookCommandHandler<{ type: string; name: string }>> {
  return async (args) => {
    const {
      namedArguments: { type, name },
    } = args;
    const finalName = camelCase(name);

    if (name !== finalName) {
      log('warning', `🐪 - Camelized the name "${finalName}".`);
    }

    if (
      type === 'route' &&
      !ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns.some((pattern) =>
        new RegExp(pattern).test(finalName),
      )
    ) {
      log(
        'error',
        `💥 - The route name "${finalName}" does not match "${ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns}".`,
      );
      throw new YError(
        'E_BAD_HANDLER_NAME',
        finalName,
        ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns,
      );
    } else if (
      type === 'cron' &&
      !CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns.some((pattern) =>
        new RegExp(pattern).test(finalName),
      )
    ) {
      log(
        'error',
        `💥 - The cron name "${finalName}" does not match "${CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns}".`,
      );
      throw new YError(
        'E_BAD_HANDLER_NAME',
        finalName,
        CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns,
      );
    }

    const { services } = (await inquirer.prompt<{
      services: string[];
    }>([
      {
        name: 'services',
        type: 'checkbox',
        message: 'Which services do you want to use?',
        choices: [
          ...Object.keys(commonServicesTypes),
          ...Object.keys(applicationServicesTypes),
          ...Object.keys(whookSimpleTypes),
          ...Object.keys(whookServicesTypes),
        ].map((value) => ({ value })),
      },
    ])) as { services: string[] };

    const servicesTypes = services
      .sort()
      .map((name) => ({
        name,
        type: allTypes[name],
      }))
      .concat(
        type === 'command'
          ? [{ name: 'promptArgs', type: 'WhookPromptArgs' }]
          : [],
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
    const applicationServices = services.filter(
      (service) => applicationServicesTypes[service],
    );
    const whookServices = services.filter(
      (service) => whookServicesTypes[service],
    );
    const imports = `${
      type === 'command'
        ? `
import {
  type WhookCommand,
  type WhookCommandDefinition,
} from '@whook/whook';`
        : ''
    }${
      commonServices.length
        ? `
import { ${commonServices
            .map((name) => `type ${commonServicesTypes[name]}`)
            .join(', ')} } from 'common-services';`
        : ''
    }${
      applicationServices.length
        ? `
import { ${applicationServices
            .map((name) => `type ${applicationServicesTypes[name]}`)
            .join(', ')} } from 'application-services';`
        : ''
    }${
      whookServices.length
        ? `
import { ${whookServices
            .map((name) => `type ${whookServicesTypes[name]}`)
            .join(', ')} } from '@whook/whook';`
        : ''
    }
`;
    let fileSource = '';

    if (type === 'route') {
      const { method, path, description, tags } = await inquirer.prompt<{
        method: string;
        path: string;
        description: string;
        tags: string[];
      }>([
        {
          name: 'method',
          type: 'list',
          message: 'Give the handler method',
          choices: PATH_ITEM_METHODS.map((method) => ({
            name: method,
            value: method,
          })),
          default: ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns
            .map(
              (pattern) => (new RegExp(pattern).exec(finalName) as string[])[2],
            )
            .filter((maybeMethod) =>
              PATH_ITEM_METHODS.includes(maybeMethod as 'get'),
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
        ...(API.tags && API.tags.length
          ? ([
              {
                name: 'tags',
                type: 'checkbox',
                message: 'Assign one or more tags to the handler',
                choices: (API.tags || []).map(({ name }) => ({
                  name,
                  value: name,
                })),
              },
            ] as const)
          : []),
      ]);
      fileSource = buildRouteSource(
        name,
        path,
        method,
        description,
        tags,
        parametersDeclaration,
        typesDeclaration,
        imports,
      );
    } else if (type === 'cron') {
      fileSource = buildCronSource(
        name,
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
      const { description } = await inquirer.prompt<{ description: string }>([
        {
          name: 'description',
          message: 'Give the command description',
          type: 'input',
        },
      ]);

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
        : type === 'route'
          ? 'routes'
          : type === 'cron'
            ? 'crons'
            : 'commands',
    );
    await ensureDir(fileDir);
    const filePath = path.join(fileDir, `${name}.ts`);
    if (await pathExists(filePath)) {
      log('warning', '⚠️ - The file already exists !');

      const { erase } = await inquirer.prompt<{
        erase: boolean;
      }>([
        {
          name: 'erase',
          message: 'Erase ?',
          type: 'confirm',
        },
      ]);

      if (!erase) {
        return;
      }
    }
    await writeFile(filePath, fileSource);
  };
}

function buildRouteSource(
  name: string,
  path: string,
  method: string,
  description = '',
  tags: string[] = [],
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const handlerInitializerName = 'init' + name[0].toUpperCase() + name.slice(1);

  return `import { autoService, location } from 'knifecycle';
import {
  type WhookRouteDefinition,
  type WhookRouteTypedHandler,
} from '@whook/whook';${imports}

export const definition = {
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
} as const satisfies WhookRouteDefinition;

export type HandlerDependencies = ${typesDeclaration || '{}'};

async function ${handlerInitializerName}(${parametersDeclaration || '_'}: HandlerDependencies) {
  const handler: WhookRouteTypedHandler<
    operations[typeof definition.operation.operationId],
    typeof definition
  > = async ({
    query: { param },${
      ['post', 'put'].includes(method)
        ? `
    body,`
        : ''
    }
  }) => {
    return {
      status: 200,
      headers: {},
      body: { param },
    };
  };

  return handler;
}

export default location(
  autoService(${handlerInitializerName}),
  import.meta.url,
);
`;
}

function buildCronSource(
  name: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const handlerInitializerName = 'init' + name[0].toUpperCase() + name.slice(1);

  return `import { autoService, location } from 'knifecycle';
import {
  type WhookCronDefinition,
} from '@whook/whook';${imports}

export const definition = {
  name: 'handleMinutes',
  schedules: [
    {
      rule: '*/1 * * * *',
      // Bodies provided here are type checked ;)
      body: { message: 'A minute starts!', delay: 10000 },
      enabled: true,
    },
  ],
  schema: { type: 'string' },
} as const satisfies WhookCronDefinition;

export type CronHandlerDependencies = ${typesDeclaration || '{}'};

async function ${handlerInitializerName}(${parametersDeclaration || '_'}: CronHandlerDependencies) {
  const handler: WhookCronHandler<string> = async ({
    date,
    body,
  }) => {
   // Cron tasks goes here
  };

  return handler;
}

export default location(
  autoService(${handlerInitializerName}),
  import.meta.url,
);
`;
}

function buildServiceSource(
  name: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);

  return `import { autoService, location } from 'knifecycle';${imports}

export type ${upperCamelizedName}Service = {};
export type ${upperCamelizedName}Dependencies = ${typesDeclaration || '{}'};

async function init${upperCamelizedName}(${
    parametersDeclaration || '_'
  }: ${upperCamelizedName}Dependencies): Promise<${upperCamelizedName}Service> {
  // Instantiate and return your service
  return {};
}

export default location(
  autoService(init${upperCamelizedName}),
  import.meta.url,
);
`;
}

function buildProviderSource(
  name: string,
  parametersDeclaration: string,
  typesDeclaration: string,
  imports: string,
) {
  const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);

  return `import { autoProvider, location, type Provider } from 'knifecycle';${imports}

export type ${upperCamelizedName}Service = {};
export type ${upperCamelizedName}Provider = Provider<${upperCamelizedName}Service>;
export type ${upperCamelizedName}Dependencies = ${typesDeclaration || '{}'};

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

export default location(
  autoProvider(init${upperCamelizedName}),
  import.meta.url,
);
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

  return `import { location, autoService } from 'knifecycle';${imports}

export const definition = {
  name: '${name}',
  description: '${description.replace(/'/g, "\\'")}',
  example: \`whook ${name} --param "value"\`,
  arguments: [{
    name: 'param',
    required: true,
    description: 'A parameter',
    schema: {
      type: 'string',
      default: 'A default value',
    },
  }],
} as const satisfies WhookCommandDefinition;

async function init${upperCamelizedName}Command(${
    parametersDeclaration || '_'
  }: ${typesDeclaration || {}}): Promise<WhookCommand<{ param: string; }>> {
  return async ({ param }) => {

  // Implement your command here
  }
}

export default location(
  autoService(init${upperCamelizedName}Command),
  import.meta.url,
);
`;
}

export default location(autoService(initCreateCommand), import.meta.url);
