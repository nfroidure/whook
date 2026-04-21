import {
  type Type,
  type ExportAssignment,
  type ExportedDeclarations,
  Node,
  Project,
} from 'ts-morph';
import { parseName } from 'knifecycle';
import createDebug from 'debug';
import { sep } from 'node:path';

const debug = createDebug('whook:types');

export type ServiceTypeDescriptor =
  | {
      type: 'literal';
      word:
        | 'string'
        | 'boolean'
        | 'number'
        | 'unknown'
        | 'null'
        | 'any'
        | 'void'
        | 'undefined'
        | 'never';
    }
  | {
      type: 'const';
      value: string | boolean | number;
    }
  | {
      type: 'alias';
      name: string;
      path: string;
    }
  | {
      type: 'failure';
    };

export async function findInitializerServiceType(
  project: Project,
  path: string,
  { serviceName, exportName }: { serviceName?: string; exportName?: string } = {
    exportName: 'default',
  },
): Promise<ServiceTypeDescriptor> {
  const sourceFile = project.addSourceFileAtPath(path);
  const fileExportDeclarations = sourceFile.getExportedDeclarations();
  const fileExportAssignments = sourceFile.getExportAssignments();
  const candidateExportNames: string[] = [];

  for (const [key] of fileExportDeclarations) {
    if (
      (serviceName && parseName(key) === serviceName) ||
      (exportName && exportName === key)
    ) {
      candidateExportNames.push(key);
    }
  }

  if (
    exportName === 'default' &&
    fileExportAssignments.length &&
    !candidateExportNames.includes('default')
  ) {
    candidateExportNames.push('default');
  }

  debug(
    '# Candidate export names: ',
    candidateExportNames.length ? candidateExportNames.join(', ') : '<none>',
  );

  for (const candidateExportName of candidateExportNames) {
    debug(`## Testing candidate export name: ${candidateExportName}`);
    debug(
      `## Testing candidate export name: ${[...fileExportDeclarations.keys()]}`,
    );
    debug(
      `## Testing candidate export name: ${fileExportDeclarations.get(candidateExportName)}`,
    );

    const exportedDeclarations = (
      (fileExportDeclarations.get(candidateExportName) || []) as (
        | ExportAssignment
        | ExportedDeclarations
      )[]
    ).concat(
      candidateExportName === 'default' && fileExportAssignments.length
        ? [...fileExportAssignments].flat()
        : [],
    );

    if (!exportedDeclarations.length) {
      debug(`- no export found with that name: ${candidateExportName}`);
      continue;
    }

    for (let declaration of exportedDeclarations) {
      let serviceType: Type | undefined;

      debug(`- pick export assignment: ${declaration.getText()}`);

      if (Node.isExportAssignment(declaration)) {
        debug(
          `- unwrap export assignment expression: ${declaration.getText()}`,
        );
        declaration = declaration.getExpression();
      }

      while (Node.isAsExpression(declaration)) {
        debug(`- unwrap as expression: ${declaration.getText()}`);
        declaration = declaration.getExpression();
      }

      if (
        Node.isClassDeclaration(declaration) ||
        Node.isEnumDeclaration(declaration) ||
        Node.isTypeAliasDeclaration(declaration) ||
        Node.isInterfaceDeclaration(declaration) ||
        Node.isModuleDeclaration(declaration) ||
        Node.isSourceFile(declaration)
      ) {
        debug(
          `- skip unsupported declaration assignment: ${declaration.print()}
ClassDeclaration: ${Node.isClassDeclaration(declaration)} ||
EnumDeclaration: ${Node.isEnumDeclaration(declaration)} ||
TypeAliasDeclaration: ${Node.isTypeAliasDeclaration(declaration)} ||
InterfaceDeclaration: ${Node.isInterfaceDeclaration(declaration)} ||
ModuleDeclaration: ${Node.isModuleDeclaration(declaration)} ||
SourceFile: ${Node.isSourceFile(declaration)} ||
         `,
        );
        continue;
      }

      if (Node.isFunctionDeclaration(declaration)) {
        debug(`- export is a function declaration`);
        serviceType = unwrapServiceType(declaration.getReturnType());
      } else if (Node.isCallExpression(declaration)) {
        debug(`- export is a call expression`);
        const type = declaration.getType();
        const signatures = type.getCallSignatures();

        if (!signatures.length) {
          debug(`- no call signature`, type.getText());
          continue;
        }

        for (const signature of signatures) {
          const returnType = signature.getReturnType();

          debug(`- call signature`, returnType.getText());
          serviceType = unwrapServiceType(returnType);
          if (serviceType) {
            break;
          }
        }
      } else if (Node.isVariableDeclaration(declaration)) {
        debug(`- export is a variable`);
        const type = declaration.getType();
        const signatures = type.getCallSignatures();

        if (!signatures.length) {
          debug(`- no call signature`, declaration.getText(), type.getText());
          continue;
        }

        for (const signature of signatures) {
          const returnType = signature.getReturnType();

          debug(`- call signature`, returnType.getText());
          serviceType = unwrapServiceType(returnType);
          if (serviceType) {
            break;
          }
        }
      }

      if (!serviceType) {
        debug(
          `- no usable type found: ${declaration.getText()} ${serviceType}`,
        );
        continue;
      }
      debug(`- found a service type`, serviceType.getText());

      if (!serviceType.isAny() && !serviceType.isNever()) {
        for (const [name, declarations] of fileExportDeclarations) {
          if (name === 'default') {
            continue;
          }

          const declaration = declarations.find(
            (value) =>
              serviceType && serviceType.isAssignableTo(value.getType()),
          );

          if (declaration) {
            serviceType = declaration ? declaration.getType() : serviceType;

            debug(
              `- type is assignable to an export: ${name}, ${declaration.getText()}`,
            );

            return {
              type: 'alias',
              name,
              path,
            };
          }
        }
      }
      return buildDescriptorFromType(path, serviceType);
    }
  }

  return {
    type: 'failure',
  };
}

function unwrapServiceType(type: Type): Type | undefined {
  let currentType = type.getAwaitedType();

  if (currentType) {
    const serviceProperty = currentType.getProperty('service');

    if (serviceProperty) {
      const node = serviceProperty.getValueDeclaration();

      if (node) {
        currentType = serviceProperty.getTypeAtLocation(node);
      }
    }
  }

  return currentType;
}

export async function findConfigServiceType(
  project: Project,
  projectPath: string,
  configKey: string,
): Promise<ServiceTypeDescriptor> {
  debug(`# Reading project module augmentations`);

  const sourceFile = project.addSourceFileAtPath(
    `${projectPath}/src/whook.d.ts`,
  );
  const moduleAugmentations = sourceFile.getModules();
  let configType: Type | undefined = undefined;

  for (const moduleAugmentation of moduleAugmentations) {
    if (configType) {
      break;
    }

    const moduleAugmentationName = moduleAugmentation.getName();

    debug(`# Found augmentation for: ${moduleAugmentationName}`);
    if (moduleAugmentationName !== "'application-services'") {
      debug(`- skipping: ${moduleAugmentationName}`);
      continue;
    }

    debug(`- reading interfaces for: ${moduleAugmentationName}`);
    const internalInterfaces = moduleAugmentation.getInterfaces();

    for (const internalInterface of internalInterfaces) {
      if (configType) {
        break;
      }
      const internalInterfaceName = internalInterface.getName();

      debug(`- testing interface: ${internalInterfaceName}`);
      if (internalInterfaceName !== 'AppConfig') {
        debug(`- skipping: ${internalInterfaceName}`);
        continue;
      }

      debug(
        '- reading properties',
        internalInterface.getProperties().map((p) => p.getName()),
      );

      const configProperty = internalInterface.getProperty(configKey);

      if (configProperty) {
        debug(`- property exists: ${configKey}`);
        configType = configProperty.getType().getNonNullableType();
        break;
      }

      const extendsExpressions = internalInterface.getExtends();

      for (const extendsExpression of extendsExpressions) {
        if (configType) {
          break;
        }
        const expression = extendsExpression.getExpression();

        if (!Node.isIdentifier(expression)) {
          debug(`- skipping extend: ${expression.getText()}`);
          break;
        }

        debug(`- analyzing extend: ${expression.getText()}`);

        for (const definition of expression.getDefinitionNodes()) {
          if (configType) {
            break;
          }

          if (Node.isInterfaceDeclaration(definition)) {
            debug(
              '- reading properties',
              definition.getProperties().map((p) => p.getName()),
            );

            const configProperty = definition.getProperty(configKey);

            if (configProperty) {
              debug(`- property exists: ${configKey}`);
              configType = configProperty.getType().getNonNullableType();
              break;
            }
          }
        }
      }
    }
  }

  if (configType) {
    debug(`# Type found: ${configType.getText()}`);
    return buildDescriptorFromType(`${projectPath}/src/whook.d.ts`, configType);
  }

  return {
    type: 'failure',
  };
}

// Logique de transformation commune (réutilisable entre handlers et config)
function buildDescriptorFromType(
  path: string,
  foundType: Type,
): ServiceTypeDescriptor {
  if (foundType.isString()) {
    debug(`- type is string`);
    return {
      type: 'literal',
      word: 'string',
    };
  }

  if (foundType.isStringLiteral()) {
    const value = foundType.getLiteralValue() as string;

    debug(`- type is string literal: ${value}`);
    return {
      type: 'const',
      value,
    };
  }

  if (foundType.isNumber()) {
    debug(`- type is number`);
    return {
      type: 'literal',
      word: 'number',
    };
  }

  if (foundType.isNumberLiteral()) {
    const value = foundType.getLiteralValue() as number;

    debug(`- type is number literal: ${value}`);
    return {
      type: 'const',
      value,
    };
  }

  if (foundType.isBoolean()) {
    debug(`- type is boolean`);
    return {
      type: 'literal',
      word: 'boolean',
    };
  }

  if (foundType.isBooleanLiteral()) {
    const value = foundType.getText() === 'true';

    debug(`- type is boolean literal: ${value}`);
    return {
      type: 'const',
      value,
    };
  }

  if (
    foundType.isNull() ||
    foundType.isUnknown() ||
    foundType.isVoid() ||
    foundType.isUndefined() ||
    foundType.isNever() ||
    foundType.isAny()
  ) {
    const word = foundType.getText() as 'unknown';

    debug(`- type is literal: ${word}`);
    return {
      type: 'literal',
      word,
    };
  }

  const typeName =
    foundType.getAliasSymbol()?.getName() || foundType.getSymbol()?.getName();

  if (typeName) {
    debug(`- type has a name: ${typeName}`);

    let finalPath = path;

    const originFile = foundType
      .getSymbol()
      ?.getDeclarations()?.[0]
      ?.getSourceFile();

    if (originFile) {
      const originFileHasServiceType = originFile
        ?.getExportedDeclarations()
        .has(typeName);

      if (originFileHasServiceType) {
        finalPath = originFile.getFilePath();
      }

      if (originFile.isInNodeModules()) {
        const parts = finalPath.split(`${sep}node_modules${sep}`);
        const nodeModulesPath = parts[parts.length - 1];
        const pathParts = nodeModulesPath.split(sep);
        let moduleName: string | undefined;

        if (nodeModulesPath.startsWith('@')) {
          moduleName = `${pathParts[0]}/${pathParts[1]}`;
        } else {
          moduleName = pathParts[0];
        }

        // const moduleSymbol = project.getAmbientModule(moduleName);

        // console.log({ moduleSymbol, moduleName });

        // typeChecker.getExportsOfModule(
        //      moduleSymbol
        // );

        // const moduleSourceFile = project.addSourceFilesAtPaths(moduleName);

        // if (moduleSourceFile.getExportedDeclarations().has(typeName)) {
        finalPath = moduleName;
        // }
      }
    }

    return {
      type: 'alias',
      name: typeName,
      path: finalPath,
    };
  }

  return { type: 'literal', word: 'unknown' };
}
