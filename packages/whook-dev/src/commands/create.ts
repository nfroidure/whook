import { sep } from 'node:path';
import {
  location,
  autoService,
  type Knifecycle,
  type Autoloader,
  type Initializer,
  type Dependencies,
  type Service,
} from 'knifecycle';
import { printStackTrace } from 'yerror';
import camelCase from 'camelcase';
import * as _inquirer from '@inquirer/prompts';
import { join } from 'node:path';
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
  type WhookConsumerDefinitionsOptions,
  DEFAULT_CONSUMERS_DEFINITIONS_OPTIONS,
  DEFAULT_COMMANDS_DEFINITIONS_OPTIONS,
  type WhookCommandsDefinitionsOptions,
  type WhookTransformerDefinitionsOptions,
  DEFAULT_TRANSFORMERS_DEFINITIONS_OPTIONS,
} from '@whook/whook';
import {
  Project,
  type SourceFile,
  type Type,
  Writers,
  SymbolFlags,
  VariableDeclarationKind,
} from 'ts-morph';
import {
  findConfigServiceType,
  findInitializerServiceType,
} from '../lib/typesGuess.js';
import { fileURLToPath } from 'node:url';

const {
  writeFile: _writeFile,
  ensureDir: _ensureDir,
  pathExists: _pathExists,
} = fsExtra;

export const AVAILABLE_TYPES = [
  'route',
  'service',
  'provider',
  'cron',
  'consumer',
  'command',
  'transformer',
] as const;

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
        enum: AVAILABLE_TYPES.concat(),
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
  CONSUMERS_DEFINITIONS_OPTIONS = DEFAULT_CONSUMERS_DEFINITIONS_OPTIONS,
  COMMANDS_DEFINITIONS_OPTIONS = DEFAULT_COMMANDS_DEFINITIONS_OPTIONS,
  TRANSFORMERS_DEFINITIONS_OPTIONS = DEFAULT_TRANSFORMERS_DEFINITIONS_OPTIONS,
  API,
  $instance,
  $autoload,
  tsProject,
  inquirer = _inquirer,
  writeFile = _writeFile,
  ensureDir = _ensureDir,
  pathExists = _pathExists,
  log = noop,
}: {
  PROJECT_DIR: string;
  ROUTES_DEFINITIONS_OPTIONS?: WhookRoutesDefinitionsOptions;
  CRONS_DEFINITIONS_OPTIONS?: WhookCronDefinitionsOptions;
  CONSUMERS_DEFINITIONS_OPTIONS?: WhookConsumerDefinitionsOptions;
  COMMANDS_DEFINITIONS_OPTIONS?: WhookCommandsDefinitionsOptions;
  TRANSFORMERS_DEFINITIONS_OPTIONS?: WhookTransformerDefinitionsOptions;
  API: OpenAPI;
  $instance: Knifecycle;
  $autoload: Autoloader<Initializer<Service, Dependencies>>;
  tsProject: Project;
  inquirer: Pick<
    typeof _inquirer,
    'checkbox' | 'confirm' | 'input' | 'rawlist'
  >;
  writeFile: (path: string, data: string) => Promise<void>;
  ensureDir: typeof _ensureDir;
  pathExists: typeof _pathExists;
  log?: LogService;
}): Promise<
  WhookCommandHandler<{
    type: (typeof AVAILABLE_TYPES)[number];
    name: string;
  }>
> {
  return async (args) => {
    const {
      namedArguments: { type, name },
    } = args;
    let finalName = camelCase(name);

    if (name !== finalName) {
      log('warning', `🐪 - Camelized the name "${finalName}".`);
    }

    let nameIsValid = type === 'service' || type === 'provider';

    while (nameIsValid === false) {
      const patterns =
        type === 'route'
          ? ROUTES_DEFINITIONS_OPTIONS.serviceNamePatterns
          : type === 'cron'
            ? CRONS_DEFINITIONS_OPTIONS.serviceNamePatterns
            : type === 'consumer'
              ? CONSUMERS_DEFINITIONS_OPTIONS.serviceNamePatterns
              : type === 'command'
                ? COMMANDS_DEFINITIONS_OPTIONS.serviceNamePatterns
                : type === 'transformer'
                  ? TRANSFORMERS_DEFINITIONS_OPTIONS.serviceNamePatterns
                  : [];

      nameIsValid = patterns.some((pattern) =>
        new RegExp(pattern).test(finalName),
      );

      if (!nameIsValid) {
        log(
          'error',
          `❌ - The ${type} name "${finalName}" does not match "${patterns.join(', ')}".`,
        );

        finalName = await inquirer.input({
          message: 'Name:',
          default: finalName,
        });
      }
    }

    const services = await inquirer.checkbox({
      message: 'Which services do you want to use?',
      choices: $instance.registered().map((value) => ({ value })),
    });

    const fileDir = join(
      PROJECT_DIR,
      'src',
      type === 'service'
        ? 'services'
        : type === 'provider'
          ? 'services'
          : type === 'route'
            ? 'routes'
            : type === 'consumer'
              ? 'consumers'
              : type === 'transformer'
                ? 'transformers'
                : type === 'cron'
                  ? 'crons'
                  : 'commands',
    );
    const filePath = join(fileDir, `${name}.ts`);
    const sourceFile = tsProject.createSourceFile(filePath);
    const upperCamelizedName = name[0].toLocaleUpperCase() + name.slice(1);
    const functionName = `init${upperCamelizedName}${type === 'command' ? 'Command' : ''}`;

    addKnifecycleImports(sourceFile, type);
    addWhookImports(sourceFile, type);

    const dependencies: {
      name: string;
      type: Type | undefined;
    }[] = [];

    for (const service of services) {
      let type = await findConfigServiceType(tsProject, PROJECT_DIR, service);

      if (type) {
        log('debug', `➕ - Type found in the config:`, type.getText());
      } else {
        let initializer = $instance.getRegisteredInitializer(service);

        if (initializer) {
          log(
            'debug',
            `➕ - Found initializer in the register:`,
            initializer.$name,
            JSON.stringify(initializer.$location),
          );
        }

        if (!initializer?.$location) {
          try {
            initializer = await $autoload(service);
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
          type = await findInitializerServiceType(
            tsProject,
            initializer.$location.url.startsWith('file:')
              ? fileURLToPath(initializer.$location.url)
              : initializer.$location.url,
            {
              exportName: initializer.$location.exportName || 'default',
              serviceName: service,
            },
          );
        }
      }

      dependencies.push({
        name: service,
        type,
      });
    }

    const symbols = new Map<Type, string>();

    // TODO: this approach is not complete since some
    // type may be imbricated inside the root type and
    // also contain ImportTypeNode that should also
    // be transformed into simple types and imported
    // in the source file. Name collisions and symbols
    // deduplication are also a concern and ain't taken
    // in count in the following "naive" code.
    for (const dependency of dependencies) {
      const type = dependency.type;

      if (!type) {
        continue;
      }

      const symbol = type?.getAliasSymbol() || type?.getSymbol();
      const declaration = symbol?.getDeclarations()[0];

      if (declaration) {
        const originFile = declaration.getSourceFile();

        if (originFile === sourceFile) {
          continue;
        }

        const typeName = symbol.getName();
        const filePath = originFile.getFilePath();
        let moduleSpecifier: string;

        if (originFile.isInNodeModules()) {
          const parts = filePath.split(`${sep}node_modules${sep}`);
          const nodeModulesPath = parts[parts.length - 1];
          const pathParts = nodeModulesPath.split(sep);

          moduleSpecifier = nodeModulesPath.startsWith('@')
            ? `${pathParts[0]}/${pathParts[1]}`
            : pathParts[0];
        } else {
          moduleSpecifier =
            sourceFile.getRelativePathAsModuleSpecifierTo(originFile);
        }

        const isDefault =
          symbol.getName() === 'default' ||
          (symbol.hasFlags(SymbolFlags.Alias) &&
            symbol.getName() === 'default');

        if (moduleSpecifier === 'typescript') {
          continue;
        }

        symbols.set(type, type.getText().replace(/^import\([^)]+\)\./, ''));

        const existingImport = sourceFile.getImportDeclaration(moduleSpecifier);

        if (existingImport) {
          existingImport.addNamedImport(dependency);
        } else {
          sourceFile.addImportDeclaration({
            moduleSpecifier,
            isTypeOnly: true,
            ...(isDefault
              ? {
                  defaultImport: typeName,
                }
              : {
                  namedImports: [typeName],
                }),
          });
        }
      }
    }

    sourceFile.addTypeAliases([
      {
        name:
          type === 'service' || type === 'provider'
            ? `${upperCamelizedName}Dependencies`
            : 'HandlerDependencies',
        type: Writers.objectType({
          properties: dependencies.map((dependency) => ({
            name: dependency.name,
            type:
              dependency.type && symbols.has(dependency.type)
                ? symbols.get(dependency.type)
                : dependency.type?.getText(sourceFile) || 'unknown',
          })),
        }),
        isExported: false,
      },
    ]);

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
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'definition',
            initializer: `
{
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
} as const satisfies WhookRouteDefinition`,
          },
        ],
      });

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: 'HandlerDependencies',
          },
        ],
        returnType: `Promise<WhookCommandHandler<{ param: string }>>`,
        statements: `
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

return handler;`,
      });

      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    } else if (type === 'service') {
      sourceFile.addTypeAliases([
        {
          name: `${upperCamelizedName}Service`,
          type: 'unknown',
          isExported: true,
        },
      ]);

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: `${upperCamelizedName}Dependencies`,
          },
        ],
        returnType: `Promise<${upperCamelizedName}Service>`,
        statements: `  // Instantiate and return your service
  return {};`,
      });

      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    } else if (type === 'provider') {
      sourceFile.addTypeAliases([
        {
          name: `${upperCamelizedName}Service`,
          type: 'unknown',
          isExported: true,
        },
        {
          name: `${upperCamelizedName}Service`,
          type: `Provider<${upperCamelizedName}Service>`,
          isExported: true,
        },
      ]);

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: `${upperCamelizedName}Dependencies`,
          },
        ],
        returnType: `Promise<${upperCamelizedName}Provider>`,
        statements: `
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
  };`,
      });

      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoProvider(${functionName}), import.meta.url)`,
      });
    } else if (type === 'command') {
      const description = await inquirer.input({
        message: 'Give the command description',
        default: '',
      });

      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'definition',
            initializer: `
{
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
} as const satisfies WhookCommandDefinition`,
          },
        ],
      });

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: 'HandlerDependencies',
          },
        ],
        returnType: `Promise<WhookCommandHandler<{ param: string; }>`,
        statements: `
  return async (args) => {
    const {
      namedArguments: { param },
    } = args;

    // Implement your command here
  }`,
      });

      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    } else if (type === 'consumer') {
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'consumerContentSchema',
            initializer: `
{
  name: 'ConsumerContent',
  schema: { type: 'array', items: { type: 'string' } },
} as const satisfies WhookSchemaDefinition<
  component['schemas']['ConsumerContent']
>`,
          },
        ],
      });
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'definition',
            initializer: `
{
  name: '${name}',
  schema: refersTo(consumerContentSchema),
} as const satisfies WhookConsumerDefinition<
  component['schemas']['ConsumerContent']
>`,
          },
        ],
      });

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: 'HandlerDependencies',
          },
        ],
        statements: `
const handler = (async (content) => {
  log('info', \`Received \${content.length} messages.\`);
  log('debug', JSON.stringify(content));
}) satisfies WhookConsumerHandler<component['schemas']['ConsumerContent']>;

return handler;
`,
      });
      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    } else if (type === 'cron') {
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'cronDataSchema',
            initializer: `
{
  name: 'CronData',
  schema: {
    type: 'object',
    required: ['message', 'delay'],
    properties: {
      message: {
        type: 'string'
      },
      delay: {
        type: 'string'
      },
    }
  },
} as const satisfies WhookSchemaDefinition<
  component['schemas']['CronData']
>`,
          },
        ],
      });
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'definition',
            initializer: `
{
  name: '${name}',
  schedules: [
    {
      rule: '*/1 * * * *',
      // Bodies provided here are type checked ;)
      body: { message: 'A minute starts!', delay: 10000 },
      enabled: true,
    },
  ],
  schema: refersTo(cronDataSchema),
} as const satisfies WhookCronDefinition<
  component['schemas']['CronData']
>`,
          },
        ],
      });

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: 'HandlerDependencies',
          },
        ],
        returnType: `Promise<WhookCommandHandler<{ param: string; }>`,
        statements: `
const handler: WhookCronHandler<
  component['schemas']['CronData']
> = async ({
  date,
  body,
}) => {
  // Cron tasks goes here
};

return handler;
`,
      });

      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    } else if (type === 'transformer') {
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'transformerInputSchema',
            initializer: `
{
  name: 'TransformerInput',
  schema: { type: 'array', items: { type: 'string' } },
} as const satisfies WhookSchemaDefinition<
  component['schemas']['TransformerInput']
>`,
          },
        ],
      });
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'transformerOutputSchema',
            initializer: `
{
  name: 'TransformerOutput',
  schema: { type: 'array', items: { type: 'string' } },
} as const satisfies WhookSchemaDefinition<
  component['schemas']['TransformerOutput']
>`,
          },
        ],
      });
      sourceFile.addVariableStatement({
        declarationKind: VariableDeclarationKind.Const,
        isExported: true,
        declarations: [
          {
            name: 'definition',
            initializer: `
{
  name: '${name}',
  inputSchema: refersTo(transformerInputSchema),
  outputSchema: refersTo(transformerOutputSchema),
} as const satisfies WhookTransformerDefinition`,
          },
        ],
      });

      sourceFile.addFunction({
        name: functionName,
        isAsync: true,
        parameters: [
          {
            name:
              dependencies.length > 0
                ? `{ ${dependencies.map((d) => d.name).join(', ')} }`
                : '_',
            type: 'HandlerDependencies',
          },
        ],
        returnType: `Promise<WhookTransformerHandler<
  component['schemas']['TransformerInput'],
  component['schemas']['TransformerOutput'],
>`,
        statements: `
return async (input) => {

  // Implement your transformation here

  return output;
}`,
      });
      sourceFile.addExportAssignment({
        isExportEquals: false,
        expression: `location(autoService(${functionName}), import.meta.url)`,
      });
    }

    sourceFile.organizeImports();
    sourceFile.fixMissingImports();

    sourceFile.formatText({
      indentSize: 2,
      convertTabsToSpaces: true,
    });

    await ensureDir(fileDir);

    if (await pathExists(filePath)) {
      log('warning', '⚠️ - The file already exists !');

      const erase = await inquirer.confirm({
        message: 'Erase ?',
      });

      if (!erase) {
        return;
      }
    }
    await writeFile(filePath, sourceFile.getText());

    await sourceFile.save();

    return;
  };
}

function addKnifecycleImports(
  sourceFile: SourceFile,
  type: (typeof AVAILABLE_TYPES)[number],
) {
  const knifecycleImport = sourceFile.addImportDeclaration({
    moduleSpecifier: 'knifecycle',
    isTypeOnly: false,
  });

  knifecycleImport.addNamedImport({
    name: 'location',
  });

  if (type === 'provider') {
    knifecycleImport.addNamedImports([
      {
        name: 'autoProvider',
      },
      {
        name: 'Provider',
        isTypeOnly: true,
      },
    ]);
  } else {
    knifecycleImport.addNamedImport({
      name: 'autoService',
    });
  }
}
function addWhookImports(
  sourceFile: SourceFile,
  type: (typeof AVAILABLE_TYPES)[number],
) {
  if (type === 'service' || type === 'provider') {
    return;
  }

  const whookImport = sourceFile.addImportDeclaration({
    moduleSpecifier: '@whook/whook',
    isTypeOnly: false,
  });

  if (type === 'route') {
    whookImport.addNamedImports([
      {
        name: 'WhookRouteDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookRouteTypedHandler',
        isTypeOnly: true,
      },
    ]);
  } else if (type === 'command') {
    whookImport.addNamedImports([
      {
        name: 'WhookCommandDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookCommandHandler',
        isTypeOnly: true,
      },
    ]);
  } else if (type === 'cron') {
    whookImport.addNamedImports([
      {
        name: 'WhookCronDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookCronHandler',
        isTypeOnly: true,
      },
      {
        name: 'WhookSchemaDefinition',
        isTypeOnly: true,
      },
      {
        name: 'refersTo',
      },
    ]);
  } else if (type === 'transformer') {
    whookImport.addNamedImports([
      {
        name: 'WhookTransformerDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookTransformerHandler',
        isTypeOnly: true,
      },
      {
        name: 'WhookSchemaDefinition',
        isTypeOnly: true,
      },
      {
        name: 'refersTo',
      },
    ]);
  } else if (type === 'consumer') {
    whookImport.addNamedImports([
      {
        name: 'WhookConsumerDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookSchemaDefinition',
        isTypeOnly: true,
      },
      {
        name: 'WhookConsumerHandler',
        isTypeOnly: true,
      },
      {
        name: 'refersTo',
      },
    ]);
  }
}

export default location(autoService(initCreateCommand), import.meta.url);
