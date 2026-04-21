import {
  location,
  autoService,
  type Knifecycle,
  Autoloader,
  Initializer,
  Dependencies,
  Service,
} from 'knifecycle';
import { printStackTrace, YError } from 'yerror';
import camelCase from 'camelcase';
import * as _inquirer from '@inquirer/prompts';
import path from 'node:path';
import { default as fsExtra } from 'fs-extra';
import { type LogService } from 'common-services';
import { type OpenAPI, PATH_ITEM_METHODS } from 'ya-open-api-types';
import {
  noop,
  type WhookCommandHandler,
  type WhookCommandDefinition,
  DEFAULT_ROUTES_DEFINITIONS_OPTIONS,
  type WhookRoutesDefinitionsOptions,
  DEFAULT_CRONS_DEFINITIONS_OPTIONS,
  type WhookCronDefinitionsOptions,
} from '@whook/whook';
import { Project } from 'ts-morph';
import {
  findConfigServiceType,
  findInitializerServiceType,
  ServiceTypeDescriptor,
} from '../lib/typesGuess.js';
import { fileURLToPath } from 'node:url';

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
  APM: 'WhookAPMService',
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
    environments: ['local'],
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
  $instance,
  $autoload,
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
  $instance: Knifecycle;
  $autoload: Autoloader<Initializer<Service, Dependencies>>;
  inquirer: Pick<
    typeof _inquirer,
    'checkbox' | 'confirm' | 'input' | 'rawlist'
  >;
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
      throw new YError('E_BAD_HANDLER_NAME', [
        finalName,
        ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns,
      ]);
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
      throw new YError('E_BAD_HANDLER_NAME', [
        finalName,
        CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns,
      ]);
    }

    const services = await inquirer.checkbox({
      message: 'Which services do you want to use?',
      choices: [
        ...new Set([
          ...$instance.registered(),
          ...Object.keys(commonServicesTypes),
          ...Object.keys(applicationServicesTypes),
          ...Object.keys(whookSimpleTypes),
          ...Object.keys(whookServicesTypes),
        ]),
      ].map((value) => ({ value })),
    });

    const notFoundTypes = services.filter((name) => !(name in allTypes));
    const foundTypes = services.filter((name) => name in allTypes);
    const guessedTypes: Record<string, ServiceTypeDescriptor> = {};

    if (notFoundTypes.length) {
      const project = new Project({
        tsConfigFilePath: `${PROJECT_DIR}/tsconfig.json`,
      });
      for (const notFoundType of notFoundTypes) {
        let result = await findConfigServiceType(
          project,
          PROJECT_DIR,
          notFoundType,
        );

        log('debug', `➕ - Type lookup in config result:`, result);

        if (result.type === 'failure') {
          let initializer = $instance.getRegisteredInitializer(notFoundType);

          log(
            'debug',
            `➕ - Register initializer lookup:`,
            initializer as unknown as string,
          );

          if (!initializer?.$location) {
            try {
              initializer = await $autoload(notFoundType);
              log(
                'debug',
                `➕ - Autoload initializer lookup:`,
                initializer as unknown as string,
              );
            } catch (err) {
              log('debug-stack', printStackTrace(err));
            }
          }

          if (initializer?.$location) {
            result = await findInitializerServiceType(
              project,
              initializer.$location.url.startsWith('file:')
                ? fileURLToPath(initializer.$location.url)
                : initializer.$location.url,
              {
                exportName: initializer.$location.exportName || 'default',
                serviceName: notFoundType,
              },
            );
          }
        }

        guessedTypes[notFoundType] = result;
      }
    }

    const servicesTypes = (foundTypes.length ? foundTypes : ['log'])
      .sort()
      .map((name) => ({
        name,
        type: allTypes[name as keyof typeof allTypes],
      }))
      .concat(
        notFoundTypes.map((notFoundType) => {
          if (guessedTypes[notFoundType].type === 'alias') {
            return {
              name: notFoundType,
              type: guessedTypes[notFoundType].name,
            };
          }
          if (guessedTypes[notFoundType].type === 'const') {
            return {
              name: notFoundType,
              type: JSON.stringify(guessedTypes[notFoundType].value),
            };
          }
          if (guessedTypes[notFoundType].type === 'literal') {
            return {
              name: notFoundType,
              type: guessedTypes[notFoundType].word,
            };
          }

          return {
            name: notFoundType,
            type: 'unknown',
          };
        }),
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
      (service): service is keyof typeof commonServicesTypes =>
        service in commonServicesTypes,
    );
    const applicationServices = services.filter(
      (service): service is keyof typeof applicationServicesTypes =>
        service in applicationServicesTypes,
    );
    const whookServices = services.filter(
      (service): service is keyof typeof whookServicesTypes =>
        service in whookServicesTypes,
    );
    const imports = `${
      type === 'command'
        ? `
import {
  type WhookCommandHandler,
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
    }${notFoundTypes
      .map((notFoundType) =>
        guessedTypes[notFoundType]?.type === 'alias'
          ? `
import { ${guessedTypes[notFoundType].name}  } from '${guessedTypes[notFoundType].path}';`
          : '',
      )
      .join('')}
`;
    let fileSource: string;

    if (type === 'route') {
      const method = await inquirer.rawlist({
        message: 'Give the handler method',
        choices: PATH_ITEM_METHODS.map((method) => ({
          name: method,
          value: method,
        })),
        default: ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns
          .map(
            (pattern) =>
              (new RegExp(pattern).exec(finalName) as string[])[2] as 'get',
          )
          .filter((maybeMethod) => PATH_ITEM_METHODS.includes(maybeMethod))[0],
      });

      const path = await inquirer.input({
        message: 'Give the handler path',
        default: '/',
      });
      const description = await inquirer.input({
        message: 'Give the handler description',
        default: '',
      });

      let tags: string[] = [];

      if (API.tags && API.tags.length) {
        tags = await inquirer.checkbox({
          message: 'Assign one or more tags to the handler',
          choices: (API.tags || ['system']).map(({ name }) => ({
            name,
            value: name,
          })),
        });
      }

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
      const description = await inquirer.input({
        message: 'Give the command description',
        default: '',
      });

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

      const erase = await inquirer.confirm({
        message: 'Erase ?',
      });

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
  }: ${typesDeclaration || {}}): Promise<
  WhookCommandHandler<{
    param: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { param },
    } = args;

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
